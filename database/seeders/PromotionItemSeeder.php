<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Promotion;
use App\Models\PromotionItem;
use Illuminate\Database\Seeder;

class PromotionItemSeeder extends Seeder
{
    public function run(): void
    {
        $promotions = Promotion::where('status', 'active')->get();

        foreach ($promotions as $promotion) {

            $products = Product::inRandomOrder()
                ->take(rand(3, 5))
                ->get();

            foreach ($products as $product) {

                $variant = $product->variants()
                    ->inRandomOrder()
                    ->first();

                PromotionItem::updateOrCreate(
                    [
                        'promotion_id' => $promotion->id,

                        'product_id' => $product->id,

                        'product_variant_id' => $variant?->id,
                    ],
                    [
                        'discount_type' => $promotion->discount_type,

                        'discount_value' => $promotion->discount_value,

                        'limit_quantity' => rand(20, 100),

                        'sold_quantity' => rand(0, 10),

                        'is_active' => true,
                    ]
                );
            }
        }
    }
}