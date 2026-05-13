<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserCampaign;
use Carbon\Carbon;

class UserCampaignSeeder extends Seeder
{
    public function run(): void
    {
        UserCampaign::create([
            'user_id' => 2,
            'campaign_id' => 1,
            'status' => 'approved',
            'approved_at' => now(),
            'expires_at' => Carbon::now()->addMinutes(30),
        ]);

        UserCampaign::create([
            'user_id' => 3,
            'campaign_id' => 1,
            'status' => 'pending',
        ]);
    }
}