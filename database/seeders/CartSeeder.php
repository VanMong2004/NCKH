<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CartSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ========================
        // CARTS
        // ========================
        DB::table('carts')->insert([
            [
                'user_id' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // ========================
        // CART ITEMS
        // ========================
        $variant1 = DB::table('product_variants')->where('product_id', 1)->first();
        $variant2 = DB::table('product_variants')->where('product_id', 2)->first();
        $variant3 = DB::table('product_variants')->where('product_id', 3)->first();

        DB::table('cart_items')->insertOrIgnore([
            // Cart 1 (User 1)
            [
                'cart_id' => 1,
                'product_variant_id' => $variant1->id, // Áo sơ mi M Trắng
                'quantity' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cart_id' => 1,
                'product_variant_id' => $variant2->id, // Balo Đen
                'quantity' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Cart 2 (User 2)
            [
                'cart_id' => 2,
                'product_variant_id' => $variant3->id, // Áo thể dục M Đen
                'quantity' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
