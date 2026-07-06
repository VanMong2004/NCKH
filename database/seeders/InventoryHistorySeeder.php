<?php

namespace Database\Seeders;

use App\Models\InventoryHistory;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class InventoryHistorySeeder extends Seeder
{
    public function run(): void
    {
        $variantStates = [];

        foreach (ProductVariant::all() as $variant) {
            $variantStates[$variant->id] = [
                'stock' => (int) $variant->stock,
                'reserved' => 0,
                'sold' => 0,
            ];

            InventoryHistory::updateOrCreate([
                'product_variant_id' => $variant->id,
                'type' => 'admin_adjust',
                'order_id' => null,
            ], [
                'product_variant_id' => $variant->id,
                'actor_id' => 1,
                'type' => 'admin_adjust',
                'stock_before' => 0,
                'stock_after' => $variant->stock,
                'reserved_before' => 0,
                'reserved_after' => 0,
                'sold_before' => 0,
                'sold_after' => 0,
                'quantity' => $variant->stock,
                'order_id' => null,
                'note' => 'Khởi tạo tồn kho ban đầu',
            ]);
        }

        foreach (Order::with('items.productVariant')->orderBy('id')->get() as $order) {
            foreach ($order->items as $item) {
                $variant = $item->productVariant;

                if (!$variant) {
                    continue;
                }

                $state = $variantStates[$variant->id];
                $quantity = (int) $item->quantity;

                $reserveBefore = $state;
                $state['reserved'] += $quantity;

                InventoryHistory::updateOrCreate([
                    'product_variant_id' => $variant->id,
                    'type' => 'checkout_reserve',
                    'order_id' => $order->id,
                ], [
                    'product_variant_id' => $variant->id,
                    'actor_id' => 1,
                    'type' => 'checkout_reserve',
                    'stock_before' => $reserveBefore['stock'],
                    'stock_after' => $state['stock'],
                    'reserved_before' => $reserveBefore['reserved'],
                    'reserved_after' => $state['reserved'],
                    'sold_before' => $reserveBefore['sold'],
                    'sold_after' => $state['sold'],
                    'quantity' => $quantity,
                    'order_id' => $order->id,
                    'note' => 'Giữ hàng khi khách checkout',
                ]);

                if ($order->status === 'completed') {
                    $completeBefore = $state;
                    $state['reserved'] = max(0, $state['reserved'] - $quantity);
                    $state['sold'] += $quantity;

                    InventoryHistory::updateOrCreate([
                        'product_variant_id' => $variant->id,
                        'type' => 'order_completed',
                        'order_id' => $order->id,
                    ], [
                        'product_variant_id' => $variant->id,
                        'actor_id' => 1,
                        'type' => 'order_completed',
                        'stock_before' => $completeBefore['stock'],
                        'stock_after' => $state['stock'],
                        'reserved_before' => $completeBefore['reserved'],
                        'reserved_after' => $state['reserved'],
                        'sold_before' => $completeBefore['sold'],
                        'sold_after' => $state['sold'],
                        'quantity' => $quantity,
                        'order_id' => $order->id,
                        'note' => 'Chuyển hàng đã giữ sang đã bán',
                    ]);
                }

                if ($order->status === 'cancelled') {
                    $releaseBefore = $state;
                    $state['reserved'] = max(0, $state['reserved'] - $quantity);

                    InventoryHistory::updateOrCreate([
                        'product_variant_id' => $variant->id,
                        'type' => 'order_release',
                        'order_id' => $order->id,
                    ], [
                        'product_variant_id' => $variant->id,
                        'actor_id' => 1,
                        'type' => 'order_release',
                        'stock_before' => $releaseBefore['stock'],
                        'stock_after' => $state['stock'],
                        'reserved_before' => $releaseBefore['reserved'],
                        'reserved_after' => $state['reserved'],
                        'sold_before' => $releaseBefore['sold'],
                        'sold_after' => $state['sold'],
                        'quantity' => $quantity,
                        'order_id' => $order->id,
                        'note' => 'Trả giữ chỗ do hủy đơn',
                    ]);
                }

                $variantStates[$variant->id] = $state;
            }
        }
    }
}
