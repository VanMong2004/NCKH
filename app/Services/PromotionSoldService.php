<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PromotionItem;

class PromotionSoldService
{
    public function increase(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            if (!$item->promotion_id) {
                continue;
            }

            $promotionItemId = data_get(
                $item->promotion_snapshot,
                'promotion_item_id'
            );

            if (!$promotionItemId) {
                continue;
            }

            PromotionItem::where('id', $promotionItemId)
                ->increment('sold_quantity', $item->quantity);
        }
    }
}