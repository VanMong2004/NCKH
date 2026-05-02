<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    // 🎯 giả lập thanh toán
    public function pay($userId, $orderId)  // Mộng thêm userId ở đây
    {
        $order = Order::with('items.productVariant')
            ->where('id', $orderId)             // Mộng thêm 2 điều kiện where
            ->where('user_id', $userId)
            ->firstOrFail();

        if ($order->status !== 'pending') {
            throw new \Exception('Order không hợp lệ');
        }

        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => $order->payment_method ?? 'unknown',
            'status' => 'pending',
            'transaction_id' => uniqid('PAY_'),
            'response_data' => null,
        ]);

        // 🔥 giả lập random success / fail
        $success = rand(0, 1);

        if ($success) {
            return $this->handleSuccess($order, $payment);
        }

        return $this->handleFail($order, $payment);
    }

    // ✅ SUCCESS
    protected function handleSuccess($order, $payment)
    {
        return DB::transaction(function () use ($order, $payment) {
            $this->orderService->finalizeOrder($order->id);

            $payment->update([
                'status' => 'success',
                'response_data' => [
                    'message' => 'Thanh toán thành công'
                ]
            ]);

            return [
                'status' => 'success',
                'message' => 'Thanh toán thành công'
            ];
        });
    }

    // ❌ FAIL → release stock
    protected function handleFail($order, $payment)
    {
        return DB::transaction(function () use ($order, $payment) {
            $order->load('items.productVariant');

            foreach ($order->items as $item) {
                $variant = $item->productVariant;

                // 🔥 trả lại reserved
                $variant->decrement('reserved_stock', $item->quantity);
            }

            $order->update([
                'status' => 'cancelled'
            ]);

            $payment->update([
                'status' => 'failed',
                'response_data' => [
                    'message' => 'Thanh toán thất bại'
                ]
            ]);

            return [
                'status' => 'fail',
                'message' => 'Thanh toán thất bại'
            ];
        });
    }
}