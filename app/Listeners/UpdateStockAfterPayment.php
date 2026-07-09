<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use Illuminate\Support\Facades\Log;
use App\Services\WebhookService;
use App\Services\Analytics\AnalyticsEventService;

class UpdateStockAfterPayment
{
    public function __construct(
        protected WebhookService $webhook,
        protected AnalyticsEventService $analyticsEventService
    ) {}

    public function handle(OrderPaid $event): void
    {
        $order = $event->order;
        $order->loadMissing(['user:id,name,email', 'payments']);

        $payment = $order->payments
            ->sortByDesc('updated_at')
            ->first();
        $userEmail = $order->user?->email;
        $guestEmail = $order->guest_email;
        $recipientEmail = $userEmail ?: $guestEmail;
        $frontendUrl = rtrim((string) (config('app.frontend_url') ?: config('app.url')), '/');
        $actionUrl = $frontendUrl . '/order-success?' . http_build_query([
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'status' => 'success',
        ]);

        $this->webhook->send('order_paid', [
            'type' => 'order_paid',
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'customer_name' => $order->shipping_name ?: $order->user?->name ?: $order->guest_name,
            'customer_email' => $recipientEmail,
            'user_email' => $userEmail,
            'guest_email' => $guestEmail,
            'recipient_email' => $recipientEmail,
            'total' => (float) ($order->grand_total ?? $order->total ?? 0),
            'payment_method' => $payment?->method,
            'paid_at' => optional($payment?->updated_at ?? now())->toIso8601String(),
            'action_url' => $actionUrl,
        ]);

        Log::info('OrderPaid webhook sent', [
            'order_id' => $order->id,
        ]);

        $this->analyticsEventService->trackPurchaseCompletedForOrder($order);
    }
}
