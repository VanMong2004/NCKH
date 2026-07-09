<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use Illuminate\Support\Facades\Log;
use App\Services\OrderEmailWebhookService;
use App\Services\Analytics\AnalyticsEventService;

class UpdateStockAfterPayment
{
    public function __construct(
        protected OrderEmailWebhookService $orderEmailWebhookService,
        protected AnalyticsEventService $analyticsEventService
    ) {}

    public function handle(OrderPaid $event): void
    {
        $order = $event->order;
        $order->loadMissing('payments');
        $payment = $order->payments->sortByDesc('updated_at')->first();

        $this->orderEmailWebhookService->sendPaymentSuccess($order, $payment);

        Log::info('OrderPaid webhook sent', [
            'order_id' => $order->id,
        ]);

        $this->analyticsEventService->trackPurchaseCompletedForOrder($order);
    }
}
