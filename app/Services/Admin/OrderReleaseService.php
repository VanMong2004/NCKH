<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Models\ProductVariant;
use App\Services\PromotionReserveService;

class OrderReleaseService
{
    public function release(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            if (!$item->product_variant_id) {
                continue;
            }

            $variant = ProductVariant::lockForUpdate()
                ->find($item->product_variant_id);

            if (!$variant) {
                continue;
            }

            $releaseQuantity = min(
                (int) $variant->reserved_stock,
                (int) $item->quantity
            );

            if ($releaseQuantity <= 0) {
                continue;
            }

            $variant->decrement(
                'reserved_stock',
                $releaseQuantity
            );
        }

        app(PromotionReserveService::class)
            ->release($order);
    }
}