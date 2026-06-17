<?php

namespace App\Services\Admin;

use RuntimeException;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class AdminOrderService
{
    public function index(array $filters = []): array
    {
        $query = Order::query()
            ->with([
                'user:id,name,email',
                'items.productVariant.product.images',
                'payments',
            ]);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->whereHas('payments', function ($q) use ($filters) {
                $q->where('status', $filters['payment_status']);
            });
        }

        if (!empty($filters['keyword'])) {
            $keyword = $filters['keyword'];

            $query->where(function ($q) use ($keyword) {
                $q->where('order_code', 'like', "%{$keyword}%")
                    ->orWhere('shipping_name', 'like', "%{$keyword}%")
                    ->orWhere('shipping_phone', 'like', "%{$keyword}%")
                    ->orWhere('guest_phone', 'like', "%{$keyword}%")
                    ->orWhere('guest_email', 'like', "%{$keyword}%");
            });
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        ($filters['sort'] ?? 'latest') === 'oldest'
            ? $query->oldest()
            : $query->latest();

        $orders = $query->paginate($filters['per_page'] ?? 10);

        $orders->setCollection(
            $orders->getCollection()
                ->map(fn ($order) => $this->formatListItem($order))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách đơn hàng thành công',
            'data' => $orders,
        ];
    }

    public function show(int $id): array
    {
        $order = Order::with([
            'user:id,name,email,phone',
            'items.productVariant.product.images',
            'payments',
        ])->find($id);

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

        return [
            'success' => true,
            'message' => 'Lấy chi tiết đơn hàng thành công',
            'data' => $this->formatDetail($order),
        ];
    }

    public function updateStatus(int $id, array $data): array
    {
        return DB::transaction(function () use ($id, $data) {
            $order = Order::with([
                'items.productVariant',
                'payments',
            ])
                ->lockForUpdate()
                ->find($id);

            if (!$order) {
                throw new RuntimeException('Đơn hàng không tồn tại', 404);
            }

            $newStatus = $data['status'];

            $this->validateStatusTransition($order->status, $newStatus);

            if ($newStatus === 'cancelled') {
                $this->cancelOrder($order, $data['cancel_reason'] ?? 'admin_cancelled');
            } elseif ($newStatus === 'completed') {
                $this->completeOrder($order);
            } else {
                $order->update([
                    'status' => $newStatus,
                ]);
            }

            return [
                'success' => true,
                'message' => 'Cập nhật trạng thái đơn hàng thành công',
                'data' => $this->formatDetail($order->fresh([
                    'user:id,name,email,phone',
                    'items.productVariant.product.images',
                    'payments',
                ])),
            ];
        });
    }

    private function validateStatusTransition(string $current, string $next): void
    {
        $allowed = [
            'pending' => ['cancelled'],
            'paid' => ['processing', 'cancelled'],
            'processing' => ['shipped', 'cancelled'],
            'shipped' => ['completed'],
            'completed' => [],
            'cancelled' => [],
        ];

        if (!in_array($next, $allowed[$current] ?? [], true)) {
            throw new RuntimeException(
                "Không thể chuyển trạng thái từ {$current} sang {$next}",
                400
            );
        }
    }

    private function cancelOrder(Order $order, string $reason): void
    {
        if ($order->status === 'pending') {
            app(OrderReleaseService::class)->release($order);
        }

        $order->update([
            'status' => 'cancelled',
            'cancel_reason' => $reason,
        ]);
    }

    private function completeOrder(Order $order): void
    {
        if ($order->status !== 'shipped') {
            throw new RuntimeException('Chỉ được hoàn tất đơn hàng đã giao', 400);
        }

        foreach ($order->items as $item) {
            if (!$item->product_variant_id) {
                continue;
            }

            $variant = ProductVariant::lockForUpdate()
                ->find($item->product_variant_id);

            if (!$variant) {
                continue;
            }

            $releaseQuantity = min(
                (int) $variant->reserved_stock,
                (int) $item->quantity
            );

            if ($releaseQuantity > 0) {
                $variant->decrement('reserved_stock', $releaseQuantity);
            }

            $variant->increment('sold_stock', $item->quantity);
        }

        $order->update([
            'status' => 'completed',
        ]);
    }

    private function formatListItem(Order $order): array
    {
        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        $firstItem = $order->items->first();

        $thumbnail = optional(
            $firstItem?->productVariant?->product?->images
                ?->where('type', 'thumbnail')
                ->first()
        )->url ?? optional(
            $firstItem?->productVariant?->product?->images
                ?->first()
        )->url;

        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'customer' => [
                'user_id' => $order->user_id,
                'name' => $order->user?->name ?? $order->guest_name,
                'email' => $order->user?->email ?? $order->guest_email,
                'phone' => $order->shipping_phone,
            ],
            'status' => $order->status,
            'payment_status' => $payment?->status ?? 'pending',
            'payment_method' => $payment?->method,
            'thumbnail' => $thumbnail,
            'item_count' => $order->items->sum('quantity'),
            'total' => (float) $order->total,
            'expired_at' => optional($order->expired_at)->format('d/m/Y H:i'),
            'cancel_reason' => $order->cancel_reason,
            'created_at' => optional($order->created_at)->format('d/m/Y H:i'),
        ];
    }

    private function formatDetail(Order $order): array
    {
        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'status' => $order->status,
            'expired_at' => optional($order->expired_at)->format('d/m/Y H:i'),
            'cancel_reason' => $order->cancel_reason,

            'customer' => [
                'user_id' => $order->user_id,
                'name' => $order->user?->name ?? $order->guest_name,
                'email' => $order->user?->email ?? $order->guest_email,
                'phone' => $order->shipping_phone,
            ],

            'receiver' => [
                'name' => $order->shipping_name,
                'phone' => $order->shipping_phone,
                'address' => $order->shipping_address,
            ],

            'payment' => $payment ? [
                'id' => $payment->id,
                'method' => $payment->method,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'transaction_id' => $payment->transaction_id,
            ] : null,

            'summary' => [
                'sub_total' => (float) $order->sub_total,
                'shipping_fee' => (float) $order->shipping_fee,
                'discount' => (float) $order->discount_total,
                'grand_total' => (float) $order->grand_total,
                'total' => (float) $order->total,
            ],

            'items' => $order->items->map(function ($item) {
                $variant = $item->productVariant;
                $product = $variant?->product;

                return [
                    'id' => $item->id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name' => $item->product_name,
                    'thumbnail' => optional(
                        $product?->images?->where('type', 'thumbnail')->first()
                    )->url ?? optional($product?->images?->first())->url,
                    'variant' => $item->variant_snapshot,
                    'price' => (float) $item->final_price,
                    'original_price' => (float) $item->original_price,
                    'discount_amount' => (float) $item->discount_amount,
                    'final_price' => (float) $item->final_price,
                    'quantity' => (int) $item->quantity,
                    'total' => (float) ($item->final_price * $item->quantity),
                    'promotion' => $item->promotion_id
                        ? $item->promotion_snapshot
                        : null,
                ];
            })->values(),
        ];
    }
}