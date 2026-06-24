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
        foreach (ProductVariant::all() as $variant) {
            InventoryHistory::create([
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

        foreach (Order::with('items.productVariant')->get() as $order) {
            foreach ($order->items as $item) {
                $variant = $item->productVariant;

                if (!$variant) {
                    continue;
                }

                InventoryHistory::create([
                    'product_variant_id' => $variant->id,
                    'actor_id' => 1,
                    'type' => 'checkout_reserve',
                    'stock_before' => $variant->stock + $item->quantity,
                    'stock_after' => $variant->stock,
                    'reserved_before' => 0,
                    'reserved_after' => $item->quantity,
                    'sold_before' => max(0, $variant->sold_stock - $item->quantity),
                    'sold_after' => max(0, $variant->sold_stock - $item->quantity),
                    'quantity' => $item->quantity,
                    'order_id' => $order->id,
                    'note' => 'Giữ hàng khi khách checkout',
                ]);

                if (in_array($order->status, ['paid', 'processing', 'shipped', 'completed'], true)) {
                    InventoryHistory::create([
                        'product_variant_id' => $variant->id,
                        'actor_id' => 1,
                        'type' => 'order_completed',
                        'stock_before' => $variant->stock,
                        'stock_after' => $variant->stock,
                        'reserved_before' => $item->quantity,
                        'reserved_after' => 0,
                        'sold_before' => max(0, $variant->sold_stock - $item->quantity),
                        'sold_after' => $variant->sold_stock,
                        'quantity' => $item->quantity,
                        'order_id' => $order->id,
                        'note' => 'Chuyển hàng đã giữ sang đã bán',
                    ]);
                }

                if ($order->status === 'cancelled') {
                    InventoryHistory::create([
                        'product_variant_id' => $variant->id,
                        'actor_id' => 1,
                        'type' => 'order_release',
                        'stock_before' => $variant->stock,
                        'stock_after' => $variant->stock + $item->quantity,
                        'reserved_before' => $item->quantity,
                        'reserved_after' => 0,
                        'sold_before' => $variant->sold_stock,
                        'sold_after' => $variant->sold_stock,
                        'quantity' => $item->quantity,
                        'order_id' => $order->id,
                        'note' => 'Hoàn trả tồn kho do hủy đơn',
                    ]);
                }
            }
        }
    }
}