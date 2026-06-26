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

        return $this->formatOrder($order);
    }

    public function showByCode($user, ?string $guestToken, string $orderCode)
    {
        $order = Order::with([
            'items.productVariant.product.images',
            'payments',
        ])
            ->where('order_code', $orderCode)
            ->first();

        if (!$order) {
            throw new RuntimeException('Không tìm thấy đơn hàng', 404);
        }

        if ($user) {
            if ((int) $order->user_id !== (int) $user->id) {
                throw new RuntimeException('Bạn không có quyền xem đơn hàng này', 403);
            }
        } else {
            if (!$guestToken || $order->guest_token !== $guestToken) {
                throw new RuntimeException('Không đủ thông tin để tra cứu đơn hàng khách', 401);
            }
        }

        return $this->formatOrder($order);
    }

    private function formatOrder(Order $order): array
    {
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

            'payment_status' => $payment?->status,
            'payment_method' => $payment?->method,

            'created_at' => optional($order->created_at)->format('d/m/Y H:i'),

            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'total' => $item->price * $item->quantity,
                ];
            })->values(),
        ];
    }
}