<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\WebhookService;

class UpdateStockAfterPayment
{
    protected $webhook;

    public function __construct(WebhookService $webhook)
    {
        $this->webhook = $webhook;
    }

    public function handle(OrderPaid $event): void
    {
        $order = $event->order;

        DB::transaction(function () use ($order) {

            foreach ($order->items as $item) {

                if (!$item->productVariant) {
                    continue;
                }

                $variant = $item->productVariant;

                // 🔥 giảm reserved
                $variant->decrement(
                    'reserved_stock',
                    $item->quantity
                );

                // 🔥 tăng sold
                $variant->increment(
                    'sold_stock',
                    $item->quantity
                );

                // 🔥 campaign logic
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

                            $q->where(
                                'user_id',
                                $order->user_id
                            );
                        })
                        ->first();

                    if ($userCampaignItem) {

                        // paid quantity
                        $userCampaignItem->increment(
                            'paid_quantity',
                            $item->quantity
                        );

                        // reserved quantity
                        $userCampaignItem->decrement(
                            'reserved_quantity',
                            $item->quantity
                        );

                        // registered quantity
                        $item->campaignItem->increment(
                            'registered_quantity',
                            $item->quantity
                        );
                    }
                }
            }
        });

        Log::info('Stock updated after payment', [
            'order_id' => $order->id
        ]);

        $this->webhook->send('order_paid', [
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'total' => $order->total
        ]);

        Log::info('OrderPaid listener triggered', [
            'order_id' => $order->id
        ]);
    }
}