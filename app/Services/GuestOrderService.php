<?php

namespace App\Services;

use RuntimeException;
use App\Models\Order;
use App\Models\Review;

class GuestOrderService
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
        $supportsOnlineRepayment = in_array($paymentMethod, ['mock', 'vnpay'], true);

        $canCancel = false;
        $canPayAgain = $order->status === 'pending'
            && $supportsOnlineRepayment
            && $paymentStatus !== 'success';

        if ($order->user_id) {
            $canCancel = $order->status === 'pending';
        }

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

    public function lookup(
        string $orderCode,
        string $phone
    )
    {
        $order = Order::with([
            'items.productVariant.product.images',
            'payments',
            'statusHistories:id,order_id,old_status,new_status,note,created_at',
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
            'statusHistories:id,order_id,old_status,new_status,note,created_at',
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
            'qr_code' => $order->order_code,
            'guest_email' => $order->guest_email,
            'customer_email' => $order->user?->email ?: $order->guest_email,
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
            'payment_status' => $payment?->status,
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
}
