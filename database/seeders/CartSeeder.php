<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        $cart = Cart::create([
            'user_id' => 2,
            'status' => 'active',
        ]);

        $variant = ProductVariant::first();

        CartItem::create([
            'cart_id' => $cart->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ]);
    }
}