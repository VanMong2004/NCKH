<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserCampaignItem;

class UserCampaignItemSeeder extends Seeder
{
    public function run(): void
    {
        UserCampaignItem::create([
            'user_campaign_id' => 1,
            'campaign_item_id' => 1,
            'quantity' => 2,
            'status' => 'approved',
        ]);

        UserCampaignItem::create([
            'user_campaign_id' => 2,
            'campaign_item_id' => 1,
            'quantity' => 1,
            'approved_quantity' => 0,
            'paid_quantity' => 0,
            'reserved_quantity' => 0,
            'status' => 'pending',
        ]);
    }
}