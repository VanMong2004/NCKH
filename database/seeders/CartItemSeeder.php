<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class CartItemSeeder extends Seeder
{
    public function run(): void
    {
        $carts = Cart::all();

        foreach ($carts as $cart) {

            $variants = ProductVariant::inRandomOrder()
                ->take(rand(3,5))
                ->get();

            foreach ($variants as $variant) {

                CartItem::updateOrCreate(
                    [
                        'cart_id' => $cart->id,
                        'product_variant_id' => $variant->id,
                    ],
                    [
                        'quantity' => rand(1,3)
                    ]
                );
            }
        }
    }
}