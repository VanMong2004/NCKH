<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PromotionItem;

class PromotionReserveService
{
    public function release(Order $order): void
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

            $promotionItem = PromotionItem::lockForUpdate()
                ->find($promotionItemId);

            if (!$promotionItem) {
                continue;
            }

            $promotionItem->decrement(
                'reserved_quantity',
                min($promotionItem->reserved_quantity, $item->quantity)
            );
        }
    }
}