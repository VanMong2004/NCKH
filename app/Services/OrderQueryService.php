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
        $awaitingReceiptTime = $this->findStatusHistoryTime($order, 'awaiting_receipt');
        $completedTime = $this->findStatusHistoryTime($order, 'completed');
        $cancelledTime = $this->findStatusHistoryTime($order, 'cancelled');

        $steps = [
            [
                'key' => 'created',
                'label' => 'Đã tạo đơn',
                'status' => true,
                'time' => optional($order->created_at)->format('d/m/Y H:i'),
                'note' => 'Hệ thống đã ghi nhận đơn hàng',
            ],
        ];

        $isOnlinePayment = $payment?->method === 'mock_bank';
        $isExpired = in_array($order->cancel_reason, ['expired', 'payment_timeout'], true);
        $isCancelled = $order->status === 'cancelled';

        if ($isOnlinePayment) {
            $steps = array_merge($steps, $this->buildPaymentTimelineSteps($order));
        }

        $steps[] = [
            'key' => 'processing',
            'label' => 'Đang chuẩn bị',
            'status' => in_array($order->status, ['processing', 'awaiting_receipt', 'completed'], true),
            'time' => $processingTime,
            'note' => 'Đơn hàng đã được tiếp nhận và bắt đầu xử lý',
        ];

        $steps[] = [
            'key' => 'awaiting_receipt',
            'label' => $order->fulfillment_method === 'pickup'
                ? 'Sẵn sàng nhận tại phòng'
                : 'Đang giao',
            'status' => in_array($order->status, ['awaiting_receipt', 'completed'], true),
            'time' => $awaitingReceiptTime,
            'note' => $order->fulfillment_method === 'pickup'
                ? 'Đơn hàng đã sẵn sàng để nhận tại Phòng Công tác Chính trị & Quản lý sinh viên Trường Đại học Kỹ thuật - Công nghệ Cần Thơ'
                : 'Đơn hàng đang được giao đến người nhận',
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

    private function buildPaymentTimelineSteps(Order $order): array
    {
        if (!$order->relationLoaded('payments')) {
            return [];
        }

        $payments = $order->payments
            ->where('method', 'mock_bank')
            ->sortBy('created_at')
            ->values();

        if ($payments->isEmpty()) {
            return [];
        }

        $multipleAttempts = $payments->count() > 1;

        return $payments->map(function ($payment, $index) use ($order, $multipleAttempts) {
            $attempt = $index + 1;
            $suffix = $multipleAttempts ? " lần {$attempt}" : '';

            $label = match ($payment->status) {
                'paid' => "Thanh toán thành công{$suffix}",
                'failed' => "Thanh toán chưa thành công{$suffix}",
                'refunded' => "Đã hoàn tiền{$suffix}",
                default => "Chờ thanh toán{$suffix}",
            };

            $note = match ($payment->status) {
                'paid' => 'Hệ thống đã xác nhận giao dịch thanh toán thành công.',
                'failed' => 'Giao dịch thanh toán chưa thành công. Bạn có thể thanh toán tiếp nếu đơn vẫn còn hiệu lực.',
                'refunded' => 'Khoản thanh toán này đã được hoàn lại.',
                default => $order->status === 'cancelled'
                    && in_array($order->cancel_reason, ['expired', 'payment_timeout'], true)
                    ? 'Đơn hàng đã quá hạn thanh toán nên giao dịch không còn hiệu lực.'
                    : (
                        $order->expired_at
                            ? 'Vui lòng hoàn tất thanh toán trước hạn để đơn hàng được tiếp tục xử lý.'
                            : 'Hệ thống đang chờ bạn hoàn tất thanh toán.'
                    ),
            };

            return [
                'key' => 'payment_' . $payment->id,
                'label' => $label,
                'status' => $payment->status !== 'unpaid',
                'time' => optional(
                    in_array($payment->status, ['paid', 'failed', 'refunded'], true)
                        ? $payment->updated_at
                        : $payment->created_at
                )->format('d/m/Y H:i'),
                'note' => $note,
            ];
        })->toArray();
    }

    private function buildOrderActions(Order $order, $payment): array
    {
        $paymentMethod = $payment?->method;
        $paymentStatus = $order->payment_status ?? $payment?->status;
        $isPendingOrder = $order->status === 'pending';
        $isExpired = $order->expired_at && now()->greaterThan($order->expired_at);
        $isOnlinePayment = $paymentMethod === 'mock_bank';
        $isOfflinePayment = in_array($paymentMethod, ['cod', 'cash_on_pickup'], true);

        $canCancel = $isPendingOrder
            && !$isExpired
            && (
                ($isOnlinePayment && in_array($paymentStatus, ['unpaid', 'failed'], true))
                || ($isOfflinePayment && $paymentStatus === 'unpaid')
            );

        $canPayAgain = $isPendingOrder
            && !$isExpired
            && $isOnlinePayment
            && in_array($paymentStatus, ['unpaid', 'failed'], true);

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
            $orders->getCollection()->map(function ($order) use ($user) {
                $order = app(OrderExpirationService::class)
                    ->expireIfNeeded($order, $user?->id);

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
                    'payment_status' => $order->payment_status ?? $payment?->status ?? 'unpaid',
                    'fulfillment_method' => $order->fulfillment_method,
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
            'user.addresses',
        ])
            ->where('user_id', $user->id)
            ->find($id);

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

        $order = app(OrderExpirationService::class)
            ->expireIfNeeded($order, $user?->id);

        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'fulfillment_method' => $order->fulfillment_method,
            'qr_code' => $order->order_code,
            'expired_at' => optional($order->expired_at)->format('d/m/Y H:i'),
            'cancel_reason' => $order->cancel_reason,
            'created_at' => optional($order->created_at)->format('d/m/Y H:i'),
            'receiver' => [
                'name' => $order->shipping_name,
                'phone' => $order->shipping_phone,
                'address' => $order->resolvedShippingAddress(),
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
                $variant = $item->productVariant;
                $product = $variant?->product;

                $productId = $product?->id;
                $productVariantId = $variant?->id;

                $review = $productId
                    ? Review::query()
                        ->with('images')
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
                    'review' => $review ? [
                        'id' => $review->id,
                        'rating' => (int) $review->rating,
                        'comment' => $review->comment,
                        'images' => $review->images
                            ? $review->images->pluck('image_url')->values()
                            : [],
                        'created_at' => optional($review->created_at)->format('d/m/Y H:i'),
                    ] : null,
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
                'location' => 'Phòng Công tác Chính trị & Quản lý sinh viên Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
                'instruction' => 'Vui lòng mang theo mã đơn hàng khi đến nhận hàng.',
            ],
            'timeline' => $this->buildOrderTimeline($order, $payment),
        ];
    }

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

            $payment = $order->payments->sortByDesc('id')->first();
            $paymentMethod = $payment?->method;
            $paymentStatus = $order->payment_status ?? $payment?->status;
            $isExpired = $order->expired_at && now()->greaterThan($order->expired_at);
            $isOnlinePayment = $paymentMethod === 'mock_bank';
            $isOfflinePayment = in_array($paymentMethod, ['cod', 'cash_on_pickup'], true);

            $canCancel = $order->status === 'pending'
                && !$isExpired
                && (
                    ($isOnlinePayment && in_array($paymentStatus, ['unpaid', 'failed'], true))
                    || ($isOfflinePayment && $paymentStatus === 'unpaid')
                );

            if (!$canCancel) {
                throw new RuntimeException('Đơn hàng hiện không thể hủy', 400);
            }

            app(\App\Services\Admin\OrderReleaseService::class)
                ->release($order);

            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => 'user_cancelled',
                'payment_status' => $order->payment_status === 'paid' ? 'paid' : 'failed',
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'changed_by' => $user->id,
                'old_status' => 'pending',
                'new_status' => 'cancelled',
                'note' => 'Người dùng hủy đơn hàng',
            ]);

            $order->payments()
                ->where('status', 'unpaid')
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
