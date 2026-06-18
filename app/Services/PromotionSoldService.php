<?php

namespace App\Services;

use RuntimeException;
use App\Models\Order;
use App\Models\PromotionItem;
use Illuminate\Support\Facades\DB;

class PromotionSoldService
{
    public function increase(Order $order): void
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
                    throw new RuntimeException(
                        'Khuyến mãi của sản phẩm không còn tồn tại',
                        400
                    );
                }

                if ((int) $promotionItem->reserved_quantity < (int) $item->quantity) {
                    throw new RuntimeException(
                        'Số lượng khuyến mãi đang giữ chỗ không đủ để xác nhận bán',
                        400
                    );
                }

                if (
                    $promotionItem->limit_quantity !== null
                    && (
                        (int) $promotionItem->sold_quantity
                        + (int) $item->quantity
                    ) > (int) $promotionItem->limit_quantity
                ) {
                    throw new RuntimeException(
                        'Số lượng khuyến mãi đã vượt giới hạn cho phép',
                        400
                    );
                }

                $promotionItem->update([
                    'sold_quantity' =>
                        (int) $promotionItem->sold_quantity
                        + (int) $item->quantity,

                    'reserved_quantity' =>
                        max(
                            0,
                            (int) $promotionItem->reserved_quantity
                            - (int) $item->quantity
                        ),
                ]);
            }
        });
    }
}