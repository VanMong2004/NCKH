<?php

namespace App\Services;

use RuntimeException;
use App\Models\Order;

class GuestOrderService
{
    public function lookup(
        string $orderCode,
        string $phone
    )
    {
        $order = Order::with([
            'items.productVariant.product.images',
            'payments',
        ])
        ->where('order_code', $orderCode)
        ->where('guest_phone', $phone)
        ->first();

        if (!$order) {
            throw new RuntimeException(
                'Không tìm thấy đơn hàng'
            );
        }

        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        return [

            'id' => $order->id,

            'order_code' => $order->order_code,

            'status' => $order->status,

            'shipping_name' => $order->shipping_name,

            'shipping_phone' => $order->shipping_phone,

            'shipping_address' => $order->shipping_address,

            'total' => $order->total,

            'payment_status'
                => $payment?->status,

            'payment_method'
                => $payment?->method,

            'created_at'
                => optional(
                    $order->created_at
                )->format('d/m/Y H:i'),

            'items' => $order->items->map(
                function ($item) {

                    return [

                        'id' => $item->id,

                        'product_name'
                            => $item->product_name,

                        'quantity'
                            => $item->quantity,

                        'price'
                            => $item->price,

                        'total'
                            => $item->price
                            *
                            $item->quantity,
                    ];
                }
            )->values(),
        ];
    }
}