<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        foreach ([
            'review_images',
            'reviews',
            'payments',
            'order_status_histories',
            'inventory_histories',
            'order_items',
            'orders',
            'cart_items',
            'carts',
            'promotion_items',
            'promotions',
            'recently_viewed_products',
            'search_histories',
            'notifications',
            'addresses',
            'product_images',
            'product_variants',
            'products',
            'categories',
            'contacts',
            'blogs',
            'faqs',
            'policies',
            'abouts',
            'system_settings',
            'site_component_items',
            'site_components',
            'users',
        ] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        Schema::enableForeignKeyConstraints();

        $this->call([
            UserSeeder::class,
            DepartmentSeeder::class,
            CategorySeeder::class,

            ProductSeeder::class,
            ProductImageSeeder::class,
            ProductVariantSeeder::class,

            PromotionSeeder::class,
            PromotionItemSeeder::class,

            AddressSeeder::class,
            CartSeeder::class,
            CartItemSeeder::class,

            OrderSeeder::class,
            PaymentSeeder::class,
            OrderStatusHistorySeeder::class,
            InventoryHistorySeeder::class,

            ReviewSeeder::class,
            ReviewImageSeeder::class,
            ProductStatisticSeeder::class,

            RecentlyViewedProductSeeder::class,
            SearchHistorySeeder::class,
            NotificationSeeder::class,

            FaqSeeder::class,
            BlogSeeder::class,
            PolicySeeder::class,
            AboutSeeder::class,
            ContactSeeder::class,

            SystemSettingSeeder::class,
            SiteContentSeeder::class,
        ]);
    }
}