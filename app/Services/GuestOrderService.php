<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Review;
use RuntimeException;

class GuestOrderService
{
    public function lookup(array $data): array
    {
        if (!empty($data['order_code'])) {
            $order = Order::with($this->relations())
                ->where('order_code', $data['order_code'])
                ->where(function ($query) use ($data) {
                    $query->where('guest_email', $data['email'])
                        ->orWhereHas('user', fn ($q) => $q->where('email', $data['email']));
                })
                ->first();

            if (!$order) {
                throw new RuntimeException('Không tìm thấy đơn hàng', 404);
            }

            return $this->formatOrder($order);
        }

        $orders = Order::with($this->relations())
            ->where(function ($query) use ($data) {
                $query->where('guest_phone', $data['phone'])
                    ->orWhere('shipping_phone', $data['phone']);
            })
            ->where(function ($query) use ($data) {
                $query->where('guest_email', $data['email'])
                    ->orWhereHas('user', fn ($q) => $q->where('email', $data['email']));
            })
            ->latest()
            ->get()
            ->map(fn ($order) => $this->formatOrder($order))
            ->values();

        if ($orders->isEmpty()) {
            throw new RuntimeException('Không tìm thấy đơn hàng', 404);
        }

        return [
            'lookup_type' => 'phone_email',
            'orders' => $orders,
        ];
    }

    public function showByCode($user, ?string $guestToken, string $orderCode)
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
            if (!$guestToken || $order->guest_token !== $guestToken) {
                throw new RuntimeException('Không đủ thông tin để tra cứu đơn hàng khách', 401);
            }
        }

        return $this->formatOrder($order);
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
                'location' => 'Phòng Công tác Chính trị và Quản lý sinh viên',
                'instruction' => 'Vui lòng mang theo mã đơn hàng hoặc mã QR khi đến nhận hàng.',
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

        $canCancel = $order->user_id
            ? $isPendingOrder
                && !$isExpired
                && (
                    ($supportsOnlineRepayment && in_array($paymentStatus, ['unpaid', 'failed'], true))
                    || ($supportsOfflineCancel && $paymentStatus === 'unpaid')
                )
            : false;

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
        $paidTime = $payment?->status === 'paid'
            ? optional($payment?->updated_at)->format('d/m/Y H:i')
            : null;

        $steps = [
            [
                'key' => 'created',
                'label' => 'Đã tạo đơn',
                'status' => true,
                'time' => optional($order->created_at)->format('d/m/Y H:i'),
            ],
        ];

        if ($payment?->method === 'mock_bank') {
            $steps[] = [
                'key' => 'payment',
                'label' => 'Thanh toán',
                'status' => $payment?->status === 'paid',
                'time' => $paidTime,
            ];
        }

        $steps[] = [
            'key' => 'processing',
            'label' => 'Đang chuẩn bị',
            'status' => in_array($order->status, ['processing', 'awaiting_receipt', 'completed'], true),
            'time' => $processingTime,
        ];

        $steps[] = [
            'key' => 'awaiting_receipt',
            'label' => $order->fulfillment_method === 'pickup'
                ? 'Sẵn sàng nhận tại phòng'
                : 'Đang giao',
            'status' => in_array($order->status, ['awaiting_receipt', 'completed'], true),
            'time' => $awaitingReceiptTime,
        ];

        $steps[] = [
            'key' => 'completed',
            'label' => 'Hoàn thành',
            'status' => $order->status === 'completed',
            'time' => $completedTime,
        ];

        if ($order->status === 'cancelled') {
            $steps[] = [
                'key' => 'cancelled',
                'label' => 'Đã hủy',
                'status' => true,
                'time' => $cancelledTime ?: optional($order->updated_at)->format('d/m/Y H:i'),
            ];
        }

        return $steps;
    }

    private function findStatusHistoryTime(Order $order, string $status): ?string
    {
        $history = $order->statusHistories
            ->firstWhere('new_status', $status);

        return optional($history?->created_at)->format('d/m/Y H:i');
    }
}
