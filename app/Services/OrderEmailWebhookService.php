<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;

class OrderEmailWebhookService
{
    public function __construct(
        protected WebhookService $webhook
    ) {}

    public function sendCodOrderCreated(Order $order): void
    {
        $this->send($order, 'cod_order_created');
    }

    public function sendPaymentSuccess(Order $order, ?Payment $payment = null): void
    {
        $this->send($order, 'payment_success', $payment);
    }

    public function send(Order $order, string $emailType, ?Payment $payment = null): void
    {
        $order->loadMissing([
            'user:id,name,email',
            'items.productVariant.product.images',
            'payments',
        ]);

        $payment ??= $this->resolvePayment($order);
        $paymentMethod = $payment?->method ?? ($emailType === 'cod_order_created' ? 'cod' : null);
        $isCod = $paymentMethod === 'cod';
        $isPaid = !$isCod && ($payment?->status === 'paid' || $emailType === 'payment_success');
        $userId = $order->user_id ?? $order->user?->id;
        $userEmail = $order->user?->email;
        $guestEmail = $order->guest_email;
        $recipientEmail = $userEmail ?: $guestEmail;

        $this->webhook->send('order_email', [
            'type' => $emailType,
            'email_type' => $emailType,
            'user_id' => $userId,
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'customer_name' => $order->shipping_name ?: $order->user?->name ?: $order->guest_name,
            'customer_email' => $recipientEmail,
            'user_email' => $userEmail,
            'guest_email' => $guestEmail,
            'recipient_email' => $recipientEmail,
            'total' => (float) ($order->grand_total ?? $order->total ?? 0),
            'subtotal' => (float) ($order->sub_total ?? $order->total ?? 0),
            'shipping_fee' => (float) ($order->shipping_fee ?? 0),
            'discount' => (float) ($order->discount_total ?? 0),
            'payment_method' => $paymentMethod,
            'payment_status' => $isCod ? 'pending' : ($payment?->status ?? 'paid'),
            'order_status' => $order->status,
            'is_cod' => $isCod,
            'is_paid' => $isPaid,
            'paid_at' => $isPaid ? optional($payment?->updated_at ?? now())->toIso8601String() : null,
            'action_url' => $this->actionUrl($order, $isPaid ? 'success' : 'pending'),
            'items' => $this->formatItems($order),
        ]);
    }

    private function resolvePayment(Order $order): ?Payment
    {
        return $order->payments
            ->sortByDesc('updated_at')
            ->first();
    }

    private function formatItems(Order $order): array
    {
        return $order->items
            ->map(function ($item) {
                $variant = $item->productVariant;
                $product = $variant?->product;
                $snapshot = $item->variant_snapshot ?? [];
                $unitPrice = (float) ($item->final_price ?? $item->price ?? 0);
                $quantity = (int) $item->quantity;

                return [
                    'product_id' => $product?->id ?? $variant?->product_id,
                    'product_name' => $item->product_name,
                    'variant_id' => $item->product_variant_id,
                    'size' => $snapshot['size'] ?? $variant?->size,
                    'color' => $snapshot['color'] ?? $variant?->color,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $unitPrice * $quantity,
                    'image_url' => $this->productImageUrl($product),
                ];
            })
            ->values()
            ->toArray();
    }

    private function productImageUrl($product): ?string
    {
        $path = trim((string) $product?->images?->sortBy('position')->first()?->url);

        if ($path === '') {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        if (Str::startsWith($path, '/')) {
            return url($path);
        }

        return asset($path);
    }

    private function actionUrl(Order $order, string $status): string
    {
        $frontendUrl = rtrim((string) (config('app.frontend_url') ?: config('app.url')), '/');

        return $frontendUrl . '/order-success?' . http_build_query([
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'status' => $status,
        ]);
    }
}
