<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Review;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class GuestOrderService
{
    public function __construct(
        protected GuestCheckoutGuardService $guestCheckoutGuardService
    ) {}

    public function lookup(array $data): array
    {
        $order = Order::with($this->relations())
            ->whereNull('user_id')
            ->where('guest_lookup_token', $this->guestCheckoutGuardService->normalizeLookupToken($data['lookup_token'] ?? ''))
            ->first();

        if (!$order) {
            throw new RuntimeException('Không tìm thấy đơn hàng', 404);
        }

        return $this->formatOrder($order);
    }

    public function showByCode($user, ?string $guestToken, ?string $guestLookupToken, string $orderCode)
    {
        $order = Order::with($this->relations())
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
            if (!$this->guestCheckoutGuardService->orderMatchesGuestAccess($order, $guestToken, $guestLookupToken)) {
                throw new RuntimeException('Không đủ thông tin để tra cứu đơn hàng khách', 401);
            }
        }

        return $this->formatOrder($order);
    }

    public function cancel(?string $guestToken, ?string $guestLookupToken, string $orderCode): array
    {
        return DB::transaction(function () use ($guestToken, $guestLookupToken, $orderCode) {
            $order = Order::with($this->relations())
                ->whereNull('user_id')
                ->where('order_code', $orderCode)
                ->lockForUpdate()
                ->first();

            if (!$order) {
                throw new RuntimeException('Không tìm thấy đơn hàng', 404);
            }

            if (!$this->guestCheckoutGuardService->orderMatchesGuestAccess($order, $guestToken, $guestLookupToken)) {
                throw new RuntimeException('Không đủ thông tin để hủy đơn hàng khách', 401);
            }

            $payment = $order->payments->sortByDesc('created_at')->first();
            $paymentMethod = $payment?->method;
            $paymentStatus = $order->payment_status ?? $payment?->status;
            $isExpired = $order->expired_at && now()->greaterThan($order->expired_at);
            $supportsOnlineRepayment = $paymentMethod === 'mock_bank';
            $supportsOfflineCancel = in_array($paymentMethod, ['cod', 'cash_on_pickup'], true);

            $canCancel = $order->status === 'pending'
                && !$isExpired
                && (
                    ($supportsOnlineRepayment && in_array($paymentStatus, ['unpaid', 'failed'], true))
                    || ($supportsOfflineCancel && $paymentStatus === 'unpaid')
                );

            if (!$canCancel) {
                throw new RuntimeException('Đơn hàng hiện không thể hủy', 400);
            }

            app(\App\Services\Admin\OrderReleaseService::class)->release($order);

            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => 'user_cancelled',
                'payment_status' => $order->payment_status === 'paid' ? 'paid' : 'failed',
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'changed_by' => null,
                'old_status' => 'pending',
                'new_status' => 'cancelled',
                'note' => 'Khách chưa đăng nhập hủy đơn hàng',
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

            return $this->formatOrder($order->fresh($this->relations()));
        });
    }

    private function relations(): array
    {
        return [
            'items.productVariant.product.images',
            'payments',
            'statusHistories:id,order_id,old_status,new_status,note,created_at',
            'user.addresses',
        ];
    }

    private function formatOrder(Order $order): array
    {
        $order = app(OrderExpirationService::class)
            ->expireIfNeeded($order);

        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'guest_lookup_token' => $order->guest_lookup_token,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'fulfillment_method' => $order->fulfillment_method,
            'qr_code' => $order->order_code,
            'guest_email' => $order->guest_email,
            'customer_email' => $order->user?->email ?: $order->guest_email,
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
            'payment_method' => $payment?->method,
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

                $review = null;

                if ($order->user_id && $productId) {
                    $review = Review::query()
                        ->where('order_id', $order->id)
                        ->where('user_id', $order->user_id)
                        ->where('product_id', $productId)
                        ->where('is_active', true)
                        ->first();
                }

                return [
                    'id' => $item->id,
                    'product_id' => $productId,
                    'product_slug' => $product?->slug,
                    'product_variant_id' => $productVariantId,
                    'review_id' => $review?->id,
                    'is_reviewed' => (bool) $review,
                    'can_review' => false,
                    'product_name' => $item->product_name ?: $product?->name,
                    'thumbnail' => optional($product?->images?->where('type', 'thumbnail')->first())->url
                        ?? optional($product?->images?->first())->url,
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
                'location' => 'Phòng Công tác chính trị - Sinh viên - Khởi nghiệp Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
                'instruction' => 'Vui lòng mang theo mã đơn hàng khi đến nhận hàng.',
            ],
            'timeline' => $this->buildOrderTimeline($order, $payment),
        ];
    }

    private function buildOrderActions(Order $order, $payment): array
    {
        $paymentMethod = $payment?->method;
        $paymentStatus = $order->payment_status ?? $payment?->status;
        $isPendingOrder = $order->status === 'pending';
        $isExpired = $order->expired_at && now()->greaterThan($order->expired_at);
        $supportsOnlineRepayment = $paymentMethod === 'mock_bank';
        $supportsOfflineCancel = in_array($paymentMethod, ['cod', 'cash_on_pickup'], true);

        $canCancel = $isPendingOrder
            && !$isExpired
            && (
                ($supportsOnlineRepayment && in_array($paymentStatus, ['unpaid', 'failed'], true))
                || ($supportsOfflineCancel && $paymentStatus === 'unpaid')
            );

        $canPayAgain = $isPendingOrder
            && !$isExpired
            && $supportsOnlineRepayment
            && in_array($paymentStatus, ['unpaid', 'failed'], true);

        return [
            'can_cancel' => $canCancel,
            'can_pay_again' => $canPayAgain,
            'can_review_order' => false,
            'available' => array_values(array_filter([
                $canCancel ? 'cancel' : null,
                $canPayAgain ? 'pay_again' : null,
            ])),
        ];
    }

    private function buildOrderTimeline(Order $order, $payment): array
    {
        $processingTime = $this->findStatusHistoryTime($order, 'processing');
        $awaitingReceiptTime = $this->findStatusHistoryTime($order, 'awaiting_receipt');
        $completedTime = $this->findStatusHistoryTime($order, 'completed');
        $cancelledTime = $this->findStatusHistoryTime($order, 'cancelled');

        $isExpired = in_array($order->cancel_reason, ['expired', 'payment_timeout'], true);
        $isCancelled = $order->status === 'cancelled';

        $steps = [
            [
                'key' => 'created',
                'label' => 'Đã tạo đơn',
                'status' => true,
                'time' => optional($order->created_at)->format('d/m/Y H:i'),
                'note' => 'Hệ thống đã ghi nhận đơn hàng',
            ],
        ];

        if ($payment?->method === 'mock_bank') {
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
                ? 'Đơn hàng đã sẵn sàng để nhận tại phòng'
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

    private function findStatusHistoryTime(Order $order, string $status): ?string
    {
        $history = $order->statusHistories
            ->firstWhere('new_status', $status);

        return optional($history?->created_at)->format('d/m/Y H:i');
    }
}
