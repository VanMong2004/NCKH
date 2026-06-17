<?php

namespace App\Services\Gateways;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use App\Events\OrderPaid;
use App\Services\PromotionSoldService;
use App\Services\Admin\OrderReleaseService;

class MockPaymentGatewayService
{
    public function __construct(
        protected PromotionSoldService $promotionSoldService,
    ) {}

    public function create(Payment $payment)
    {
        // giả lập trả URL
        return [
            'payment_id' => $payment->id,
            'transaction_id' => $payment->transaction_id,
            'redirect_url' => url("/api/payment/callback?payment_id={$payment->id}&status=success&method=mock")
        ];
    }

    public function callback(array $data)
    {
        return DB::transaction(function () use ($data) {

            $payment = Payment::lockForUpdate()->findOrFail($data['payment_id']);

            // 🔥 chống double callback
            if ($payment->status === 'success') {
                return [
                    'message' => 'Payment đã xử lý',
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'status' => 'success',
                ];
            }

            $order = Order::lockForUpdate()->findOrFail($payment->order_id);

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

            $status = $data['status'] === 'success' ? 'success' : 'failed';

            $payment->update([
                'status' => $status,
                'response_data' => $data
            ]);

            if ($status === 'success') {

                $wasPaid = $order->status === 'paid';

                $order->update([
                    'status' => 'paid'
                ]);

                $order->load('items.productVariant');

                if (!$wasPaid) {
                    $this->promotionSoldService->increase($order);
                }

                event(new OrderPaid($order));
            } else {

                app(OrderReleaseService::class)
                    ->release($order->load('items.productVariant'));

                $order->update([
                    'status' => 'cancelled',
                    'cancel_reason' => 'payment_failed',
                ]);
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