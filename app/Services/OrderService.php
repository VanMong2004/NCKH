<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Address;

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

            // 🔥 validate stock
            foreach ($cart->items as $item) {

                $variant = ProductVariant::lockForUpdate()
                    ->find($item->product_variant_id);

                $available =
                    $variant->stock - $variant->reserved_stock;

                if ($available < $item->quantity) {

                    throw new Exception(
                        "Sản phẩm {$variant->product->name} không đủ hàng"
                    );
                }
            }

            $address = Address::query()
                ->where('user_id', $user->id)
                ->findOrFail($data['address_id']);

            // 🔥 create order
            $order = Order::create([
                'user_id' => $user->id,

                'type' => 'normal',

                'order_code' => $this->generateOrderCode(),

                'status' => 'pending',

                'total' => 0,

                'shipping_fee' => 0,

                'shipping_name'
                    => $address->full_name,

                'shipping_phone'
                    => $address->phone,

                'shipping_address'
                    => implode(', ', [

                        $address->address_line,

                        $address->ward,

                        $address->district,

                        $address->province,
                    ]),
            ]);           

            $total = 0;

            // 🔥 create items
            foreach ($cart->items as $item) {

                $variant = ProductVariant::lockForUpdate()
                    ->find($item->product_variant_id);

                // reserve stock
                $variant->increment(
                    'reserved_stock',
                    $item->quantity
                );

                $price = $variant->price;

                $lineTotal = $price * $item->quantity;

                OrderItem::create([

                    'order_id' => $order->id,

                    'product_variant_id'
                        => $variant->id,

                    // ❌ KHÔNG có user_campaign_item_id

                    'price' => $price,

                    'quantity' => $item->quantity,

                    'product_name'
                        => $variant->product->name,

                    'variant_snapshot' => [
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'sku' => $variant->sku,
                    ],
                ]);

                $total += $lineTotal;
            }

            // update total
            $order->update([
                'total' => $total
            ]);

            $order->refresh();

            event(new \App\Events\OrderCreated($order));

            // close cart
            $cart->update([
                'status' => 'checked_out'
            ]);

            return $order;
        });

        // 🔥 auto cancel
        CancelPendingOrderJob::dispatch($order->id)
            ->delay(
                now()->addMinutes(
                    config('app.order_auto_cancel_minutes')
                )
            );

        $order->load('items');

        $items = $order->items;

        $subTotal = $items->sum(function ($item) {
            return $item->price * $item->quantity;
        });

        $shippingFee = $order->shipping_fee ?? 0;

        $paymentMethod = $data['payment_method'] ?? 'mock';

        return [
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'status' => $order->status,

            'sub_total' => $subTotal,
            'shipping_fee' => $shippingFee,
            'discount' => 0,
            'grand_total' => $order->total,

            'payment_method' => $paymentMethod,

            'items' => $items->map(fn($item) => [
                'product_name' => $item->product_name,
                'price' => $item->price,
                'quantity' => $item->quantity,
                'total' => $item->price * $item->quantity,
            ]),
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