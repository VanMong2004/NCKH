<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Review;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class OrderQueryService
{
    private function findStatusHistoryTime(Order $order, string $status): ?string
    {
        if (!$order->relationLoaded('statusHistories')) {
            return null;
        }

        $history = $order->statusHistories
            ->where('new_status', $status)
            ->sortBy('created_at')
            ->last();

        return optional($history?->created_at)->format('d/m/Y H:i');
    }

    private function buildOrderTimeline(Order $order, $payment): array
    {
        $processingTime = $this->findStatusHistoryTime($order, 'processing');
        $shippedTime = $this->findStatusHistoryTime($order, 'shipped');
        $completedTime = $this->findStatusHistoryTime($order, 'completed');
        $cancelledTime = $this->findStatusHistoryTime($order, 'cancelled');
        $paidTime = $this->findStatusHistoryTime($order, 'paid')
            ?: ($payment?->status === 'success'
                ? optional($payment?->updated_at)->format('d/m/Y H:i')
                : null);

        $steps = [
            [
                'key' => 'created',
                'label' => 'Đã tạo đơn',
                'status' => true,
                'time' => optional($order->created_at)->format('d/m/Y H:i'),
                'note' => 'Hệ thống đã ghi nhận đơn hàng',
            ],
        ];

        $isOnlinePayment = in_array($payment?->method, ['mock', 'vnpay'], true);
        $isExpired = in_array($order->cancel_reason, ['expired', 'payment_timeout'], true);
        $isCancelled = $order->status === 'cancelled';

        if ($isOnlinePayment) {
            $steps[] = [
                'key' => 'payment',
                'label' => 'Thanh toán',
                'status' => $payment?->status === 'success',
                'time' => $paidTime,
                'note' => match ($payment?->status) {
                    'pending' => 'Đang chờ thanh toán',
                    'failed' => 'Thanh toán chưa thành công',
                    'success' => 'Đã thanh toán thành công',
                    default => 'Chưa có giao dịch hoàn tất',
                },
            ];
        }

        $steps[] = [
            'key' => 'processing',
            'label' => 'Đang xử lý',
            'status' => in_array($order->status, ['processing', 'shipped', 'completed'], true),
            'time' => $processingTime,
            'note' => 'Đơn hàng đã được tiếp nhận và bắt đầu xử lý',
        ];

        $steps[] = [
            'key' => 'shipped',
            'label' => 'Đang giao / chờ nhận',
            'status' => in_array($order->status, ['shipped', 'completed'], true),
            'time' => $shippedTime,
            'note' => 'Đơn hàng đang được giao hoặc chờ người nhận xác nhận',
        ];

        $steps[] = [
            'key' => 'completed',
            'label' => 'Hoàn thành',
            'status' => $order->status === 'completed',
            'time' => $completedTime,
            'note' => 'Đơn hàng đã hoàn tất',
        ];

        if ($isCancelled) {
            $steps[] = [
                'key' => 'cancelled',
                'label' => $isExpired ? 'Đã hết hạn' : 'Đã hủy',
                'status' => true,
                'time' => $cancelledTime ?: optional($order->updated_at)->format('d/m/Y H:i'),
                'note' => $isExpired
                    ? 'Đơn hàng đã hết hạn thanh toán'
                    : 'Đơn hàng đã bị hủy',
            ];
        }

        return $steps;
    }

    private function buildOrderActions(Order $order, $payment): array
    {
        $paymentMethod = $payment?->method;
        $paymentStatus = $payment?->status;

        $canCancel = $order->status === 'pending';
        $canPayAgain = $order->status === 'pending'
            && in_array($paymentMethod, ['mock', 'vnpay'], true)
            && $paymentStatus !== 'success';

        return [
            'can_cancel' => $canCancel,
            'can_pay_again' => $canPayAgain,
            'can_review_order' => $order->status === 'completed',
            'available' => array_values(array_filter([
                $canCancel ? 'cancel' : null,
                $canPayAgain ? 'pay_again' : null,
                $order->status === 'completed' ? 'review' : null,
            ])),
        ];
    }

    /**
     * My orders
     */
    public function myOrders($user, array $filters)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $query = Order::with([
            'items:id,order_id,product_variant_id,quantity',
            'items.productVariant:id,product_id',
            'items.productVariant.product:id,name,slug',
            'items.productVariant.product.images:id,product_id,url,type,position',
            'payments:id,order_id,method,status,created_at',
        ])
            ->where('user_id', $user->id);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['keyword'])) {
            $query->where('order_code', 'like', '%' . $filters['keyword'] . '%');
        }

        $sort = $filters['sort'] ?? 'latest';

        $sort === 'oldest'
            ? $query->oldest()
            : $query->latest();

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 50);

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
                    'title' => optional($firstItem?->productVariant?->product)->name,
                    'status' => $order->status,
                    'payment_status' => $payment?->status ?? 'pending',
                    'payment_method' => $payment?->method,
                    'thumbnail' => $thumbnail,
                    'item_count' => $order->items->sum('quantity'),
                    'total' => (float) $order->total,
                    'qr_code' => $order->order_code,
                    'expired_at' => optional($order->expired_at)->format('d/m/Y H:i'),
                    'cancel_reason' => $order->cancel_reason,
                    'created_at' => optional($order->created_at)->format('d/m/Y H:i'),
                    'actions' => $this->buildOrderActions($order, $payment),
                    'detail_url' => '/profile/orders/' . $order->id,
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
            'reviews',
            'statusHistories:id,order_id,old_status,new_status,note,created_at',
        ])
            ->where('user_id', $user->id)
            ->find($id);

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'status' => $order->status,
            'qr_code' => $order->order_code,
            'expired_at' => optional($order->expired_at)->format('d/m/Y H:i'),
            'cancel_reason' => $order->cancel_reason,
            'created_at' => optional($order->created_at)->format('d/m/Y H:i'),
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
                'created_at' => optional($payment->created_at)->format('d/m/Y H:i'),
                'updated_at' => optional($payment->updated_at)->format('d/m/Y H:i'),
            ] : null,
            'actions' => $this->buildOrderActions($order, $payment),
            'summary' => [
                'sub_total' => (float) ($order->sub_total ?? 0),
                'shipping_fee' => (float) ($order->shipping_fee ?? 0),
                'discount' => (float) ($order->discount_total ?? 0),
                'grand_total' => (float) ($order->grand_total ?? $order->total),
            ],
            'items' => $order->items->map(function ($item) use ($order) {
                /** @var \App\Models\OrderItem $item */

                $variant = $item->productVariant;
                $product = $variant?->product;

                $productId = $product?->id;
                $productVariantId = $variant?->id;

                $review = $productId
                    ? Review::query()
                        ->where('order_id', $order->id)
                        ->where('user_id', $order->user_id)
                        ->where('product_id', $productId)
                        ->where('is_active', true)
                        ->first()
                    : null;

                $isReviewed = (bool) $review;

                return [
                    'id' => $item->id,
                    'product_id' => $productId,
                    'product_slug' => $product?->slug,
                    'product_variant_id' => $productVariantId,
                    'review_id' => $review?->id,
                    'is_reviewed' => $isReviewed,
                    'can_review' => $order->status === 'completed'
                        && !empty($productId)
                        && !$isReviewed,
                    'product_name' => $item->product_name ?: $product?->name,
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
            })->values(),
            'pickup' => [
                'location' => 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
                'instruction' => 'Vui lòng mang theo MSSV, mã đơn hàng hoặc mã QR để nhận hàng.',
            ],
            'timeline' => $this->buildOrderTimeline($order, $payment),
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
                ->find($id);

            if (!$order) {
                throw new RuntimeException('Đơn hàng không tồn tại', 404);
            }

            if ($order->status !== 'pending') {
                throw new RuntimeException('Chỉ được hủy đơn hàng đang chờ xử lý', 400);
            }

            app(\App\Services\Admin\OrderReleaseService::class)
                ->release($order);

            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => 'user_cancelled',
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'changed_by' => $user->id,
                'old_status' => 'pending',
                'new_status' => 'cancelled',
                'note' => 'Người dùng hủy đơn hàng',
            ]);

            $order->payments()
                ->where('status', 'pending')
                ->update([
                    'status' => 'failed',
                    'response_data' => [
                        'reason' => 'user_cancelled',
                    ],
                ]);

            app(\App\Services\Analytics\AnalyticsEventService::class)
                ->broadcastDashboardRefresh();

            return $order->fresh();
        });
    }
}
