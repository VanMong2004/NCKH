<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use App\Services\WebhookService;

class SendOrderCreatedWebhook
{
    protected $webhook;

    public function __construct(WebhookService $webhook)
    {
        $this->webhook = $webhook;
    }

    public function handle(OrderCreated $event)
    {
        $order = $event->order;

        $this->webhook->send('order_created', [
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'total' => $order->total
        ]);
    }
}