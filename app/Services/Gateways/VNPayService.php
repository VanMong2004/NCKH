<?php

namespace App\Services\Gateways;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use App\Events\OrderPaid;
use App\Services\PromotionSoldService;
use App\Services\Admin\OrderReleaseService;
use App\Services\NotificationService;

class VNPayService
{
    public function __construct(
        protected PromotionSoldService $promotionSoldService,
    ) {}

    public function create(Payment $payment)
    {
        $vnpUrl = config('services.vnpay.url');
        $returnUrl = route('payment.callback');

        $params = [
            'vnp_TxnRef' => $payment->id,
            'vnp_Amount' => $payment->amount * 100,
            'vnp_OrderInfo' => 'Thanh toán đơn hàng',
            'vnp_ReturnUrl' => $returnUrl,
        ];

        $query = http_build_query($params);

        return [
            'payment_id' => $payment->id,
            'transaction_id' => $payment->transaction_id,
            'redirect_url' => $vnpUrl . '?' . $query
        ];
    }

    public function callback(array $data)
    {
        return DB::transaction(function () use ($data) {

            $payment = Payment::lockForUpdate()->findOrFail($data['vnp_TxnRef']);

            if (in_array($payment->status, ['success', 'refunded'])) {
                return [
                    'message' => 'Payment đã xử lý',
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'status' => 'success',
                ];
            }

            $order = Order::lockForUpdate()->findOrFail($payment->order_id);

            if (
                $order->status === 'pending'
                && $order->expired_at
                && now()->greaterThan($order->expired_at)
            ) {
                app(OrderReleaseService::class)
                    ->release($order->load('items.productVariant'));

                $payment->update([
                    'status' => 'failed',
                    'response_data' => $data,
                ]);

                $order->update([
                    'status' => 'cancelled',
                    'cancel_reason' => 'payment_timeout',
                ]);

                app(NotificationService::class)
                    ->order(
                        $order->fresh(),
                        'cancelled'
                    );

                return [
                    'message' => 'Đơn hàng đã hết hạn thanh toán',
                    'payment_id' => $payment->id,
                    'order_id' => $order->id,
                    'status' => 'failed',
                ];
            }

            if ($order->status === 'cancelled') {
                $payment->update([
                    'status' => 'failed',
                    'response_data' => $data,
                ]);

                return [
                    'message' => 'Đơn hàng đã bị hủy, không thể thanh toán',
                    'payment_id' => $payment->id,
                    'order_id' => $order->id,
                    'status' => 'failed',
                ];
            }

            $status = ($data['vnp_ResponseCode'] === '00') ? 'success' : 'failed';

            $payment->update([
                'status' => $status,
                'response_data' => $data
            ]);

            if ($status === 'success') {

                $wasPaid = $order->status === 'paid';

                $order->update([
                    'status' => 'paid'
                ]);

                app(NotificationService::class)
                    ->order(
                        $order->fresh(),
                        'paid'
                    );

                $order->load('items.productVariant');

                if (!$wasPaid) {
                    $this->promotionSoldService->increase($order);
                }

                event(new OrderPaid($order));
            } else {

                $order->update([
                    'status'=>'cancelled',
                    'cancel_reason'=>'payment_failed',
                ]);

                app(OrderReleaseService::class)
                    ->release(
                        $order->load('items.productVariant')
                    );

                app(NotificationService::class)
                    ->order(
                        $order->fresh(),
                        'cancelled'
                    );

            }

            return [
                'message' => 'Callback xử lý thành công',
                'payment_id' => $payment->id,
                'order_id' => $order->id,
                'status' => $status,
            ];
        });
    }
}