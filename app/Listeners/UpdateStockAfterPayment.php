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

        $this->webhook->send('order_paid', [
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'total' => $order->total,
        ]);

        Log::info('OrderPaid webhook sent', [
            'order_id' => $order->id,
        ]);

        $this->analyticsEventService->trackPurchaseCompletedForOrder($order);
    }
}
