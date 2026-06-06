<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Address;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Exception;
use App\Jobs\CancelPendingOrderJob;

class OrderService
{
    // =========================
    // CHECKOUT
    // =========================
    public function checkout($user, array $data)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $order = DB::transaction(function () use ($user, $data) {
            // $cart = Cart::where('user_id', $user->id)
            //     ->where('status', 'active')
            //     ->first();

            // if (!$cart) {
            //     throw new RuntimeException('Giỏ hàng trống', 400);
            // }

            // $selectedItems = CartItem::with('productVariant.product')
            //     ->where('cart_id', $cart->id)
            //     ->whereIn('id', $data['cart_item_ids'])
            //     ->get();

            $cart = Cart::with([
                'items' => function ($query) use ($data) {
                    $query->whereIn('id', $data['cart_item_ids']);
                },
                'items.productVariant.product'
            ])
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

            $selectedItems = $cart->items;

            if ($selectedItems->isEmpty()) {
                throw new RuntimeException(
                    'Không có sản phẩm nào được chọn',
                    400
                );
            }

            foreach ($selectedItems as $item) {
                $variant = ProductVariant::with('product')
                    ->lockForUpdate()
                    ->find($item->product_variant_id);

                if (!$variant) {
                    throw new RuntimeException('Biến thể sản phẩm không tồn tại', 404);
                }

                $available = $variant->stock - $variant->reserved_stock;

                if ($available < $item->quantity) {
                    $productName = $variant->product?->name ?? 'Sản phẩm';

                    throw new RuntimeException(
                        "Sản phẩm {$productName} không đủ hàng",
                        400
                    );
                }
            }

            $address = Address::query()
                ->where('user_id', $user->id)
                ->find($data['address_id']);

            if (!$address) {
                throw new RuntimeException('Địa chỉ giao hàng không tồn tại', 404);
            }

            $order = Order::create([
                'user_id' => $user->id,

                'type' => 'normal',

                'order_code' => $this->generateOrderCode(),

                'status' => 'pending',

                'total' => 0,

                'shipping_fee' => 0,

                'shipping_name' => $address->full_name,

                'shipping_phone' => $address->phone,

                'shipping_address' => implode(', ', [
                    $address->address_line,
                    $address->ward,
                    $address->district,
                    $address->province,
                ]),
            ]);

            $total = 0;

            foreach ($selectedItems as $item) {
                $variant = ProductVariant::with('product')
                    ->lockForUpdate()
                    ->find($item->product_variant_id);

                if (!$variant) {
                    throw new RuntimeException('Biến thể sản phẩm không tồn tại', 404);
                }

                $variant->increment(
                    'reserved_stock',
                    $item->quantity
                );

                $price = $variant->price;

                $lineTotal = $price * $item->quantity;

                OrderItem::create([
                    'order_id' => $order->id,

                    'product_variant_id' => $variant->id,

                    'price' => $price,

                    'quantity' => $item->quantity,

                    'product_name' => $variant->product?->name ?? 'Sản phẩm',

                    'variant_snapshot' => [
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'sku' => $variant->sku,
                    ],
                ]);

                $total += $lineTotal;
            }

            $order->update([
                'total' => $total,
            ]);

            $order->refresh();

            event(new \App\Events\OrderCreated($order));

            // $cart->update([
            //     'status' => 'checked_out',
            // ]);
            CartItem::whereIn(
                'id',
                $selectedItems->pluck('id')
            )->delete();

            return $order;
        });

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

            'items' => $items->map(fn ($item) => [
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