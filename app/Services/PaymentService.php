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

    /**
     * Create payment
     */
    public function pay(Order $order, string $method)
    {
        return DB::transaction(function () use ($order, $method) {

            $order = Order::lockForUpdate()->find($order->id);

            if (!$order) {
                throw new \Exception('Order không tồn tại');
            }

            if ($order->status !== 'pending') {
                throw new \Exception('Order không hợp lệ để thanh toán');
            }

            // ❗ đã có payment success
            if ($order->payments()->where('status', 'success')->exists()) {
                throw new \Exception('Order đã được thanh toán');
            }

            $latestPayment = $order->payments()
                ->where('status', 'pending')
                ->latest()
                ->first();

            if ($latestPayment) {
                throw new \Exception('Đơn hàng đang có payment đang xử lý');
            }

            // 🔥 check pending
            $pendingPayment = $order->payments()
                ->where('status', 'pending')
                ->latest()
                ->first();

            if ($pendingPayment) {
                return $this->resolveGateway($pendingPayment);
            }

            // 🔥 create mới
            $payment = Payment::create([
                'order_id' => $order->id,
                'method' => $method,
                'status' => 'pending',
                'amount' => $order->total,
                'transaction_id' => Str::uuid(),
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

            default:
                throw new \Exception('Payment method không hỗ trợ');
        }
    }

    /**
     * Handle callback
     */
    public function handleCallback(array $data)
    {
        $method = $data['method'] ?? 'mock';

        switch ($method) {
            case 'mock':
                $result = $this->mockGateway->callback($data);
                break;

            case 'vnpay':
                $result = $this->vnpayGateway->callback($data);
                break;

            default:
                throw new \Exception('Callback không hợp lệ');
        }

        return $result;
    }
}