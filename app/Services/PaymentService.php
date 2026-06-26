<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Services\Gateways\MockPaymentGatewayService;
use App\Services\Gateways\VNPayService;
use App\Events\OrderPaid;
use RuntimeException;


class PaymentService
{
    protected $mockGateway;
    protected $vnpayGateway;

    public function __construct(
        MockPaymentGatewayService $mockGateway,
        VNPayService $vnpayGateway
    ) {
        $this->mockGateway = $mockGateway;
        $this->vnpayGateway = $vnpayGateway;
    }

    private const COD_MAX_AMOUNT = 500000;

    /**
     * Create payment
     */
    public function pay($user, ?string $guestToken, int $orderId, string $method)
    {
        if (!$user && !$guestToken) {
            throw new RuntimeException('Thiếu mã đơn hàng khách', 400);
        }

        return DB::transaction(function () use ($user, $guestToken, $orderId, $method) {
            $orderQuery = Order::lockForUpdate()
                ->where('status', 'pending');

            if ($user) {
                $orderQuery->where('user_id', $user->id);
            } else {
                $orderQuery->where('guest_token', $guestToken);
            }

            $order = $orderQuery->find($orderId);

            if (!$order) {
                throw new RuntimeException('Đơn hàng không tồn tại', 404);
            }

            if ($order->expired_at && now()->greaterThan($order->expired_at)) {
                app(\App\Services\Admin\OrderReleaseService::class)
                    ->release($order);

                $order->update([
                    'status' => 'cancelled',
                    'cancel_reason' => 'expired',
                ]);

                throw new RuntimeException('Đơn hàng đã hết hạn thanh toán', 400);
            }

            if ($order->payments()->where('status', 'success')->exists()) {
                throw new RuntimeException('Đơn hàng đã được thanh toán', 409);
            }

            $pendingPayment = $order->payments()
                ->where('status', 'pending')
                ->latest()
                ->first();

            if ($pendingPayment) {

                // COD chỉ tạo 1 payment duy nhất
                if ($pendingPayment->method === 'cod') {

                    return [
                        'payment_id'   => $pendingPayment->id,
                        'order_id'     => $order->id,
                        'order_code'   => $order->order_code,
                        'method'       => 'cod',
                        'status'       => 'pending',
                        'need_callback'=> false,
                        'redirect_url' => null,
                    ];
                }

                throw new RuntimeException(
                    'Đơn hàng đang có giao dịch chờ thanh toán',
                    409
                );
            }

            if (
                $method === 'cod'
                && $order->total > self::COD_MAX_AMOUNT
            ) {
                throw new RuntimeException(
                    'COD chỉ áp dụng cho đơn hàng từ 500.000đ trở xuống',
                    400
                );
            }

            $payment = Payment::create([
                'order_id' => $order->id,
                'method' => $method,
                'status' => 'pending',
                'amount' => $order->total,
                'transaction_id' =>
                    $method === 'cod'
                        ? null
                        : Str::uuid(),
            ]);

            return $this->resolveGateway($payment);
        });
    }

    protected function resolveGateway($payment)
    {
        switch ($payment->method) {
            case 'mock':
                return $this->mockGateway->create($payment);

            case 'vnpay':
                return $this->vnpayGateway->create($payment);
            
            case 'cod':

                $payment->load('order');

                return [
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'order_code' => $payment->order->order_code,

                    'method' => 'cod',

                    'status' => 'pending',

                    'need_callback' => false,

                    'amount' => (float) $payment->amount,

                    'redirect_url' => null,

                    'message' => 'Đơn hàng đã được tạo thành công.',
                ];
            
            default:
                throw new \Exception('Payment method không hỗ trợ');
        }
    }

    public function handleCallback(array $data)
    {
        if (isset($data['vnp_TxnRef'])) {
            return $this->vnpayGateway->callback($data);
        }

        $method = $data['method'] ?? 'mock';

        switch ($method) {
            case 'mock':
                return $this->mockGateway->callback($data);

            case 'vnpay':
                return $this->vnpayGateway->callback($data);

            default:
                throw new RuntimeException('Callback không hợp lệ', 400);
        }
    }
}