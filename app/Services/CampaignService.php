<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\CampaignItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CampaignService
{
    public function checkout($userId, $data)
    {
        return DB::transaction(function () use ($userId, $data) {

            $campaign = Campaign::with('items.productVariant')
                ->findOrFail($data['campaign_id']);

            // ❌ check active
            if (now()->lt($campaign->start_date) || now()->gt($campaign->end_date)) {
                throw new \Exception('Campaign không hoạt động');
            }

            $total = 0;
            $itemsData = [];

            foreach ($data['items'] as $inputItem) {

                $campaignItem = CampaignItem::with('productVariant.product')
                    ->findOrFail($inputItem['campaign_item_id']);

                // ❌ check thuộc campaign
                if ($campaignItem->campaign_id != $campaign->id) {
                    throw new \Exception('Sản phẩm không thuộc campaign');
                }

                $quantity = $inputItem['quantity'];

                if ($quantity <= 0) {
                    throw new \Exception('Số lượng không hợp lệ');
                }

                $subtotal = $campaignItem->price * $quantity;

                $total += $subtotal;

                $itemsData[] = [
                    'campaign_item' => $campaignItem,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal
                ];
            }

            // 🧾 CREATE ORDER
            $order = Order::create([
                'user_id' => $userId,
                'campaign_id' => $campaign->id,
                'type' => 'campaign',
                'status' => 'pending',
                'shipping_name' => 'Nhận tại trường',
                'shipping_phone' => '0000000000',
                'shipping_address' => 'CTUT',
                'total' => $total,
                'shipping_fee' => 0,
                'order_code' => 'CP-' . strtoupper(Str::random(8)),
            ]);

            // 📦 CREATE ORDER ITEMS
            foreach ($itemsData as $item) {

                $variant = $item['campaign_item']->productVariant;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'campaign_item_id' => $item['campaign_item']->id,
                    'price' => $item['campaign_item']->price,
                    'quantity' => $item['quantity'],
                    'product_name' => $variant->product->name ?? null,
                    'variant_snapshot' => $variant->size . '-' . $variant->color,
                ]);

                // 🔥 UPDATE REGISTERED
                $item['campaign_item']->increment('registered_quantity', $item['quantity']);
            }

            return $order->load('items.productVariant');
        });
    }
}