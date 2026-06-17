<?php

namespace App\Services\Admin;

use App\Models\ProductVariant;
use App\Models\InventoryHistory;

class InventoryHistoryService
{
    public function record(
        ProductVariant $before,
        ProductVariant $after,
        string $type,
        int $quantity = 0,
        ?int $orderId = null,
        ?int $actorId = null,
        ?string $note = null
    ): void {
        InventoryHistory::create([
            'product_variant_id' => $after->id,
            'actor_id' => $actorId,
            'type' => $type,

            'stock_before' => (int) $before->stock,
            'stock_after' => (int) $after->stock,

            'reserved_before' => (int) $before->reserved_stock,
            'reserved_after' => (int) $after->reserved_stock,

            'sold_before' => (int) $before->sold_stock,
            'sold_after' => (int) $after->sold_stock,

            'quantity' => $quantity,
            'order_id' => $orderId,
            'note' => $note,
        ]);
    }
}