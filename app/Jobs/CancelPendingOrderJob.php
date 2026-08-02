<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\OrderExpirationService;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class CancelPendingOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $orderId;

    public function __construct($orderId)
    {
        $this->orderId = (int) $orderId;
    }

    public function handle(): void
    {
        $order = Order::find($this->orderId);

        if (!$order) {
            return;
        }

        $order = app(OrderExpirationService::class)
            ->expireIfNeeded($order);

        if ($order->status === 'cancelled' && $order->cancel_reason === 'payment_timeout') {
            Log::info('Auto cancel order', [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
            ]);
        }
    }
}
