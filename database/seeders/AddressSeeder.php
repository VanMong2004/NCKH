<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AddressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // CARTS
        DB::table('carts')->insert([
            [
                'user_id' => 1,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 2,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // CART ITEMS
        DB::table('cart_items')->insert([
            [
                'cart_id' => 1,
                'product_variant_id' => 1, // nên map theo DB thực tế
                'quantity' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cart_id' => 1,
                'product_variant_id' => 2,
                'quantity' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cart_id' => 2,
                'product_variant_id' => 3,
                'quantity' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
