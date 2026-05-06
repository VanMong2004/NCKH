<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Campaign;
use App\Models\CampaignItem;
use App\Models\ProductVariant;

class CampaignSeeder extends Seeder
{
    public function run(): void
    {
        $campaign = Campaign::create([
            'title' => 'Đăng ký áo CTU',
            'start_date' => now()->subDays(2),
            'end_date' => now()->addDays(5),
            'is_active' => true,
        ]);

        foreach (ProductVariant::all() as $variant) {

            CampaignItem::create([
                'campaign_id' => $campaign->id,
                'product_variant_id' => $variant->id,
                'price' => $variant->price,
                'registered_quantity' => rand(1, 10),
            ]);
        }
    }
}