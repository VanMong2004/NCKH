<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductVariantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('product_variants')->insert([
            // Product 1
            [
                'product_id' => 1,
                'size' => 'M',
                'color' => 'Trắng',
                'sku' => 'CTUT-SM-W-M',
                'price' => 150000,
                'stock' => 20,
                'reserved_stock' => 2,
                'sold_stock' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 1,
                'size' => 'L',
                'color' => 'Trắng',
                'sku' => 'CTUT-SM-W-L',
                'price' => 150000,
                'stock' => 15,
                'reserved_stock' => 1,
                'sold_stock' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Product 2
            [
                'product_id' => 2,
                'size' => 'M',
                'color' => 'Đen',
                'sku' => 'CTUT-PE-BL-M',
                'price' => 200000,
                'stock' => 12,
                'reserved_stock' => 1,
                'sold_stock' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Product 3
            [
                'product_id' => 3,
                'size' => null,
                'color' => 'Đen',
                'sku' => 'CTUT-BAG-BL',
                'price' => 300000,
                'stock' => 25,
                'reserved_stock' => 3,
                'sold_stock' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Product 4
            [
                'product_id' => 4,
                'size' => null,
                'color' => 'Xanh',
                'sku' => 'CTUT-NOTE-BL',
                'price' => 20000,
                'stock' => 50,
                'reserved_stock' => 5,
                'sold_stock' => 20,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
