<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;
use App\Jobs\CancelPendingOrderJob;

class OrderService
{
    // =========================
    // CHECKOUT
    // =========================
    public function checkout($user, $data)
    {
        $order = DB::transaction(function () use ($user, $data) {

            $cart = Cart::with('items.productVariant.product')
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->firstOrFail();

            if ($cart->items->isEmpty()) {
                throw new Exception('Giỏ hàng trống');
            }

            foreach ($cart->items as $item) {
                $variant = ProductVariant::lockForUpdate()->find($item->product_variant_id);

                $available = $variant->stock - $variant->reserved_stock;

                if ($available < $item->quantity) {
                    throw new Exception("Sản phẩm {$variant->product->name} không đủ hàng");
                }
            }

            // 🔥 tạo order
            $order = Order::create([
                'user_id' => $user->id,
                'type' => 'normal',
                'order_code' => $this->generateOrderCode(),
                'status' => 'pending',
                'total' => 0,
                'shipping_fee' => 0,
                'shipping_name' => $data['shipping_name'],
                'shipping_phone' => $data['shipping_phone'],
                'shipping_address' => $data['shipping_address'],
            ]);

            event(new \App\Events\OrderCreated($order));

            $total = 0;

            foreach ($cart->items as $item) {

                $variant = ProductVariant::lockForUpdate()->find($item->product_variant_id);

                $variant->increment('reserved_stock', $item->quantity);

                $price = $variant->price;
                $lineTotal = $price * $item->quantity;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'price' => $price,
                    'quantity' => $item->quantity,
                    'product_name' => $variant->product->name,
                    'variant_snapshot' => "Size: {$variant->size}, Color: {$variant->color}",
                ]);

                $total += $lineTotal;
            }

            $order->update([
                'total' => $total
            ]);

            $cart->update([
                'status' => 'checked_out'
            ]);

            return $order;
        });

        CancelPendingOrderJob::dispatch($order->id)
            ->delay(now()->addMinutes(config('app.order_auto_cancel_minutes')));

        return [
            'success' => true,
            'message' => 'Đặt hàng thành công',
            'data' => [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'total' => $order->total
            ]
        ];
    }

    // =========================
    // GENERATE ORDER CODE
    // =========================
    private function generateOrderCode()
    {
        $date = now()->format('Ymd');

        $count = Order::whereDate('created_at', now())->count() + 1;

        return 'ORD-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}