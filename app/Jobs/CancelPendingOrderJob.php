<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;
use App\Services\WebhookService;

class CancelPendingOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $orderId;

    public function __construct($orderId)
    {
        $this->orderId = $orderId;
    }

    public function handle(): void
    {
        DB::transaction(function () {

            $order = Order::lockForUpdate()->find($this->orderId);

            if (!$order) {
                return;
            }

            // ❗ chỉ cancel nếu vẫn pending
            if ($order->status !== 'pending') {
                return;
            }

            // 🔥 update order
            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => 'payment_timeout'
            ]);

            app(WebhookService::class)->send('order_cancelled', [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'reason' => $order->cancel_reason
            ]);

            // 🔥 release reserved_stock
            foreach ($order->items as $item) {
                if ($item->productVariant) {
                    $variant = $item->productVariant;

                    $variant->decrement('reserved_stock', $item->quantity);
                }

                if (
                    $order->type === 'campaign'
                    && $item->campaign_item_id
                ) {

                    $userCampaignItem =
                        \App\Models\UserCampaignItem::where(
                            'campaign_item_id',
                            $item->campaign_item_id
                        )
                        ->whereHas('userCampaign', function ($q) use ($order) {

                            $q->where('user_id', $order->user_id);
                        })
                        ->first();

                    if ($userCampaignItem) {

                        $userCampaignItem->decrement(
                            'reserved_quantity',
                            $item->quantity
                        );
                    }
                }
            }

            // 📝 log (optional)
            Log::info('Auto cancel order', [
                'order_id' => $order->id
            ]);
        });
    }
}