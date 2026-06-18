<?php

namespace App\Services;

use RuntimeException;
use App\Models\Order;
use App\Models\PromotionItem;
use Illuminate\Support\Facades\DB;

class PromotionReserveService
{
    public function release(Order $order): void
    {
        DB::transaction(function () use ($order) {
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

                $promotionItem = PromotionItem::query()
                    ->whereKey($promotionItemId)
                    ->lockForUpdate()
                    ->first();

                if (!$promotionItem) {
                    continue;
                }

                $releaseQuantity = min(
                    (int) $promotionItem->reserved_quantity,
                    (int) $item->quantity
                );

                if ($releaseQuantity <= 0) {
                    continue;
                }

                $promotionItem->decrement(
                    'reserved_quantity',
                    $releaseQuantity
                );
            }
        });
    }
}