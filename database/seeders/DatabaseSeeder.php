<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            ProductImageSeeder::class,
            ProductVariantSeeder::class,
            CampaignSeeder::class,
            CampaignItemSeeder::class,
            NotificationSeeder::class,
            CartSeeder::class,
            CartItemSeeder::class,
            OrderSeeder::class,
            PaymentSeeder::class,
            ReviewSeeder::class,
            UserCampaignSeeder::class,
            UserCampaignItemSeeder::class,
            AddressSeeder::class,
            FaqSeeder::class,
            BlogSeeder::class,
            PolicySeeder::class,
        ]);
    }
}