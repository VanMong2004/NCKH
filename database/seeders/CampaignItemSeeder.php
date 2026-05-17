<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\CampaignItem;
use Illuminate\Database\Seeder;

class CampaignItemSeeder extends Seeder
{
    public function run(): void
    {
        $mapping = [
            'Đăng ký đồng phục K2026' => [
                'Áo CTU K2026',
                'Túi tote CTU',
                'Nón CTU',
            ],
            'Áo khoa Công nghệ thông tin' => [
                'Áo khoa CNTT',
            ],
            'Hoodie CTU mùa đông' => [
                'Hoodie CTU Premium',
            ],
            'Tuần lễ tân sinh viên' => [
                'Áo Freshman Week',
                'Ly giữ nhiệt CTU',
                'Móc khóa CTU',
            ],
            'Merchandise CTU tháng trước' => [
                'Sticker CTU',
                'Bảng tên sinh viên',
            ],
        ];

        foreach ($mapping as $campaignName => $productNames) {
            $campaign = Campaign::where('title', $campaignName)->first();

            if (!$campaign) {
                continue;
            }

            foreach ($productNames as $productName) {
                $product = Product::where('name', $productName)->first();

                if (!$product) {
                    continue;
                }

                $variants = ProductVariant::where('product_id', $product->id)
                    ->take(3)
                    ->get();

                foreach ($variants as $variant) {
                    $limitQuantity = rand(80, 250);

                    CampaignItem::updateOrCreate(
                        [
                            'campaign_id' => $campaign->id,
                            'product_variant_id' => $variant->id,
                        ],
                        [
                            'price' => max(0, $variant->price - rand(5000, 30000)),
                            'limit_quantity' => $limitQuantity,
                            'registered_quantity' => rand(0, min(120, $limitQuantity)),
                        ]
                    );
                }
            }
        }
    }
}