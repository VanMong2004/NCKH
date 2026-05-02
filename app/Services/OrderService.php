<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function checkout($userId, $cart, $data)
    {
        if ($cart->items->isEmpty()) {
            throw new \Exception('Giỏ hàng trống');
        }

        return DB::transaction(function () use ($userId, $cart, $data) {

            $total = 0;

            // 🔥 1. CHECK + LOCK STOCK
            foreach ($cart->items as $item) {

                $variant = ProductVariant::lockForUpdate()->find($item->product_variant_id);

                if (!$variant) {
                    throw new \Exception('Sản phẩm không tồn tại');
                }

                $available = $variant->stock - $variant->reserved_stock;

                if ($item->quantity > $available) {
                    throw new \Exception("Sản phẩm {$variant->sku} chỉ còn {$available}");
                }

                // 🔒 giữ hàng (anti oversell)
                $variant->increment('reserved_stock', $item->quantity);

                $total += $item->quantity * $variant->price;
            }

            // 🧾 2. TẠO ORDER
            $order = Order::create([
                'user_id' => $userId,
                'shipping_name' => $data['shipping_name'],
                'shipping_phone' => $data['shipping_phone'],
                'shipping_address' => $data['shipping_address'],
                'total' => 0, // update sau
                'shipping_fee' => 0,
                'status' => 'pending',
                'order_code' => 'ORD-' . strtoupper(Str::random(8)),
            ]);

            

            // 📦 3. TẠO ORDER ITEMS
            foreach ($cart->items as $item) {

                $variant = ProductVariant::find($item->product_variant_id);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'price' => $variant->price,
                    'quantity' => $item->quantity,
                    'product_name' => $variant->product->name ?? null,
                    'variant_snapshot' => $variant->size . '-' . $variant->color,
                ]);
            }

            // 💰 4. UPDATE TOTAL
            $order->update([
                'total' => $total
            ]);

            // 🧹 5. CLEAR CART (quan trọng)
            $cart->items()->delete();

            return $order->load('items.productVariant');
        });
    }

    public function finalizeOrder($orderId)
    {
        return DB::transaction(function () use ($orderId) {

            $order = Order::with('items.productVariant')->findOrFail($orderId);

            if ($order->status !== 'pending') {
                throw new \Exception('Order không hợp lệ');
            }

            foreach ($order->items as $item) {

                $variant = ProductVariant::lockForUpdate()->find($item->product_variant_id);

                if (!$variant) {
                    throw new \Exception('Variant không tồn tại');
                }

                // 🔥 TRỪ STOCK THẬT
                $variant->decrement('stock', $item->quantity);

                // 🔥 GIẢM RESERVED
                $variant->decrement('reserved_stock', $item->quantity);

                // 🔥 TĂNG SOLD
                $variant->increment('sold_stock', $item->quantity);
            }

            // ✅ update order status
            $order->update([
                'status' => 'paid'
            ]);

            return $order;
        });
    }

    public function cancelOrder($order)
    {
        if ($order->status !== 'pending') {
            throw new \Exception('Chỉ được huỷ đơn khi đang chờ thanh toán');
        }

        return DB::transaction(function () use ($order) {

            // 🔥 rollback reserved stock
            foreach ($order->items as $item) {

                $variant = ProductVariant::lockForUpdate()->find($item->product_variant_id);

                // trả lại stock đã giữ
                $variant->decrement('reserved_stock', $item->quantity);
            }

            // ❌ update status
            $order->update([
                'status' => 'cancelled'
            ]);

            return $order->fresh('items.productVariant');
        });
    }

    public function updateStatus($order, $newStatus)
    {
        $allowed = [
            'paid' => ['processing'],
            'processing' => ['shipped'],
            'shipped' => ['completed']
        ];

        if (!isset($allowed[$order->status])) {
            throw new \Exception('Không thể cập nhật trạng thái đơn này');
        }

        if (!in_array($newStatus, $allowed[$order->status])) {
            throw new \Exception("Không thể chuyển từ {$order->status} sang {$newStatus}");
        }

        return DB::transaction(function () use ($order, $newStatus) {

            // 🔥 FINAL STEP: completed → chốt stock
            // if ($newStatus === 'completed') {
            //     foreach ($order->items as $item) {

            //         $variant = $item->productVariant;

            //         $variant->decrement('stock', $item->quantity);
            //         $variant->decrement('reserved_stock', $item->quantity);
            //         $variant->increment('sold_stock', $item->quantity);
            //     }
            // }

            $order->update([
                'status' => $newStatus
            ]);

            return $order->fresh('items.productVariant');
        });
    }

    // public function confirmOrder($order, $userId)
    // {
    //     // ❌ không phải chủ đơn
    //     if ($order->user_id !== $userId) {
    //         throw new \Exception('Không có quyền');
    //     }

    //     // ❌ sai trạng thái
    //     if ($order->status !== 'shipped') {
    //         throw new \Exception('Chỉ được xác nhận khi đơn đang giao');
    //     }

    //     return DB::transaction(function () use ($order) {

    //         // 🔥 finalize stock (CHUẨN SHOPEE)
    //         foreach ($order->items as $item) {

    //             $variant = $item->productVariant;

    //             $variant->decrement('stock', $item->quantity);
    //             $variant->decrement('reserved_stock', $item->quantity);
    //             $variant->increment('sold_stock', $item->quantity);
    //         }

    //         $order->update([
    //             'status' => 'completed'
    //         ]);

    //         return $order->fresh('items.productVariant');
    //     });
    // }
    public function confirmOrder($order, $userId)
    {
        if ($order->user_id !== $userId) {
            throw new \Exception('Không có quyền');
        }

        if ($order->status !== 'shipped') {
            throw new \Exception('Chỉ được xác nhận khi đơn đang giao');
        }

        return DB::transaction(function () use ($order) {
            $order->update([
                'status' => 'completed'
            ]);

            return $order->fresh('items.productVariant');
        });
    }
}