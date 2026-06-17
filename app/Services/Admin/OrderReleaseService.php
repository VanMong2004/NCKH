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

            $before = clone $variant;

            $variant->decrement(
                'reserved_stock',
                $releaseQuantity
            );

            $after = $variant->fresh();

            app(\App\Services\Admin\InventoryHistoryService::class)->record(
                $before,
                $after,
                'order_release',
                $releaseQuantity,
                $order->id,
                null,
                'Trả hàng giữ chỗ do hủy/thanh toán thất bại'
            );
        }

        app(PromotionReserveService::class)
            ->release($order);
    }
}