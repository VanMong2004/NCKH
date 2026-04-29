<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('orders')->insert([
            [
                'user_id' => 1,
                'shipping_name' => 'Nguyễn Văn A',
                'shipping_phone' => '0901234567',
                'shipping_address' => 'Bình Thủy, Cần Thơ',
                'status' => 'processing',
                'total' => 600000,
                'shipping_fee' => 15000,
                'order_code' => 'ORD-10001',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 2,
                'shipping_name' => 'Trần Thị B',
                'shipping_phone' => '0912345678',
                'shipping_address' => 'Cái Răng, Cần Thơ',
                'status' => 'completed',
                'total' => 200000,
                'shipping_fee' => 10000,
                'order_code' => 'ORD-10002',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('order_items')->insert([
            [
                'order_id' => 1,
                'product_variant_id' => 1,
                'price' => 150000,
                'quantity' => 2,
                'product_name' => 'Áo sơ mi CTUT',
                'variant_snapshot' => 'M - Trắng',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'order_id' => 1,
                'product_variant_id' => 2,
                'price' => 300000,
                'quantity' => 1,
                'product_name' => 'Balo CTUT',
                'variant_snapshot' => 'Đen',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
