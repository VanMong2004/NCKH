<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    // 🎯 giả lập thanh toán
    public function pay($orderId)
    {
        $order = Order::with('items.productVariant')->findOrFail($orderId);

        if ($order->status !== 'pending') {
            throw new \Exception('Order không hợp lệ');
        }

        // 🔥 giả lập random success / fail
        $success = rand(0, 1);

        if ($success) {
            // ✅ thanh toán thành công
            return $this->handleSuccess($order);
        }

        // ❌ thất bại
        return $this->handleFail($order);
    }

    // ✅ SUCCESS
    protected function handleSuccess($order)
    {
        return DB::transaction(function () use ($order) {

            // 🔥 finalize (reuse code)
            $this->orderService->finalizeOrder($order->id);

            return [
                'status' => 'success',
                'message' => 'Thanh toán thành công'
            ];
        });
    }

    // ❌ FAIL → release stock
    protected function handleFail($order)
    {
        return DB::transaction(function () use ($order) {

        $order->load('items.productVariant');

        foreach ($order->items as $item) {

                $variant = $item->productVariant;

                // 🔥 trả lại reserved
                $variant->decrement('reserved_stock', $item->quantity);
            }

            $order->update([
                'status' => 'cancelled'
            ]);

            return [
                'status' => 'fail',
                'message' => 'Thanh toán thất bại'
            ];
        });
    }
}