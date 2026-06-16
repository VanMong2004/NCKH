<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class OrderQueryService
{
    /**
     * My orders
     */
    public function myOrders($user, array $filters)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $order = Order::with([
            'items.productVariant.product.images',
            'payments',
        ])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['keyword'])) {
            $query->where('order_code', 'like', '%' . $filters['keyword'] . '%');
        }

        $sort = $filters['sort'] ?? 'latest';

        if ($sort === 'oldest') {
            $query->oldest();
        } else {
            $query->latest();
        }

        $perPage = $filters['per_page'] ?? 10;

        $orders = $query->paginate($perPage);

        $orders->setCollection(
            $orders->getCollection()->map(function ($order) {
                $payment = $order->payments
                    ->sortByDesc('created_at')
                    ->first();

                $firstItem = $order->items->first();

                $thumbnail = optional(
                    $firstItem?->productVariant?->product?->images
                        ?->where('type', 'thumbnail')
                        ->first()
                )->url
                ?? optional(
                    $firstItem?->productVariant?->product?->images
                        ?->first()
                )->url;

                return [
                    'id' => $order->id,

                    'order_code' => $order->order_code,

                    'title' => $order->type === 'campaign'
                        ? optional($order->campaign)->title
                        : optional($firstItem?->productVariant?->product)->name,

                    'type' => $order->type,

                    'status' => $order->status,

                    'payment_status' => $payment?->status ?? 'pending',

                    'payment_method' => $payment?->method,

                    'thumbnail' => $thumbnail,

                    'item_count' => $order->items->sum('quantity'),

                    'total' => (int) $order->total,

                    'qr_code' => $order->order_code,

                    'created_at' => optional(
                        $order->created_at
                    )->format('d/m/Y H:i'),

                    'detail_url' => "/profile/orders/" . $order->id,
                ];
            })
        );

        return $orders;
    }

    /**
     * Show order detail
     */
    public function show($user, $id)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $order = Order::with([
            'items.productVariant.product.images',
            'payments',
        ])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        return [
            'id' => $order->id,

            'order_code' => $order->order_code,

            'type' => $order->type,

            'status' => $order->status,

            'qr_code' => $order->order_code,

            'receiver' => [
                'name' => $order->shipping_name,
                'phone' => $order->shipping_phone,
                'address' => $order->shipping_address,
            ],

            'payment' => $payment ? [
                'id' => $payment->id,
                'method' => $payment->method,
                'status' => $payment->status,
                'amount' => $payment->amount,
                'transaction_id' => $payment->transaction_id,
            ] : null,

            'summary' => [
                'sub_total' => (float) ($order->sub_total ?? 0),

                'shipping_fee' => (float) ($order->shipping_fee ?? 0),

                'discount' => (float) ($order->discount_total ?? 0),

                'grand_total' => (float) ($order->grand_total ?? $order->total),
            ],

            'items' => $order->items->map(function ($item) {
                /** @var \App\Models\OrderItem $item */

                $variant = $item->productVariant;
                $product = $variant?->product;

                return [
                    'id' => $item->id,

                    'product_name' => $item->product_name,

                    'thumbnail' => optional(
                        $product?->images?->where('type', 'thumbnail')->first()
                    )->url ?? optional($product?->images?->first())->url,

                    'variant' => $item->variant_snapshot,

                    'price' => (float) ($item->final_price ?? $item->price),

                    'original_price' => (float) ($item->original_price ?? $item->price),

                    'discount_amount' => (float) ($item->discount_amount ?? 0),

                    'final_price' => (float) ($item->final_price ?? $item->price),

                    'quantity' => (int) $item->quantity,

                    'total' => (float) (($item->final_price ?? $item->price) * $item->quantity),

                    'promotion' => $item->promotion_id
                        ? $item->promotion_snapshot
                        : null,
                ];
            }),

            'pickup' => [
                'location' => 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
                'instruction' => 'Vui lòng mang theo MSSV, mã đơn hàng hoặc mã QR để nhận hàng.',
            ],

            'timeline' => [
                [
                    'label' => 'Đã tạo đơn',
                    'status' => true,
                    'time' => optional($order->created_at)->format('d/m/Y H:i'),
                ],
                [
                    'label' => 'Đã thanh toán',
                    'status' => $payment?->status === 'success',
                    'time' => $payment?->updated_at?->format('d/m/Y H:i'),
                ],
                [
                    'label' => 'Chờ nhận hàng',
                    'status' => in_array($order->status, [
                        'paid',
                        'processing',
                        'ready_to_pickup',
                        'delivered',
                        'completed',
                    ]),
                    'time' => null,
                ],
            ],
        ];
    }

    /**
     * Cancel order
     */
    public function cancel($user, $id)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        return DB::transaction(function () use ($user, $id) {
            $order = Order::with([
                'items.productVariant.product.images',
                'payments',
            ])
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->findOrFail($id);

            if (!$order) {
                throw new RuntimeException('Đơn hàng không tồn tại', 404);
            }

            if ($order->status !== 'pending') {
                throw new RuntimeException('Chỉ được hủy đơn hàng đang chờ xử lý', 400);
            }

            app(\App\Services\PromotionReserveService::class)
                ->release($order->load('items'));

            foreach ($order->items as $item) {
                if ($item->productVariant) {
                    $item->productVariant->decrement(
                        'reserved_stock',
                        $item->quantity
                    );
                }
            }

            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => 'user_cancelled',
            ]);

            return $order->fresh();
        });
    }

    /**
     * Confirm order
     */
    public function confirm($user, $id)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $order = Order::where('user_id', $user->id)
            ->find($id);

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

        if ($order->status !== 'shipped') {
            throw new RuntimeException('Chỉ được xác nhận khi đơn hàng đã giao', 400);
        }

        $order->update([
            'status' => 'completed',
        ]);

        return $order->fresh();
    }
}