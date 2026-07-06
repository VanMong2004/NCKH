<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\PromotionItem;
use Illuminate\Database\Seeder;

class PromotionItemSeeder extends Seeder
{
    public function run(): void
    {
        $freshman = Promotion::where('title', 'Chào tân sinh viên K2026')->first();
        $opening = Promotion::where('title', 'Tuần lễ khai giảng')->first();

        if ($freshman) {
            foreach ([
                'Áo thun CTUT K2026',
                'Hoodie CTUT Premium',
                'Áo Freshman Week 2026',
                'Túi tote CTUT',
            ] as $productName) {
                $product = Product::where('name', $productName)->first();

                if (!$product) {
                    continue;
                }

                $totalStock = (int) ProductVariant::where('product_id', $product->id)->sum('stock');

                PromotionItem::updateOrCreate([
                    'promotion_id' => $freshman->id,
                    'product_id' => $product->id,
                    'variant_unique_key' => 0,
                ], [
                    'promotion_id' => $freshman->id,
                    'product_id' => $product->id,
                    'product_variant_id' => null,
                    'variant_unique_key' => 0,
                    'discount_type' => 'percent',
                    'discount_value' => 10,
                    'limit_quantity' => max(1, min(500, $totalStock)),
                    'sold_quantity' => 0,
                    'reserved_quantity' => 0,
                    'is_active' => true,
                ]);
            }
        }

        if ($opening) {
            $variantRules = [
                ['Ly giữ nhiệt CTUT', ['capacity' => '750ml'], 30000],
                ['Sticker CTUT', ['package' => 'Combo 20 sticker'], 5000],
                ['Bảng tên sinh viên CTUT', ['type' => 'Sinh viên'], 10000],
                ['Dây đeo thẻ CTUT', ['material' => 'Polyester'], 5000],
            ];

            foreach ($variantRules as [$productName, $attributes, $discount]) {
                $product = Product::where('name', $productName)->first();

                if (!$product) {
                    continue;
                }

                $variant = ProductVariant::where('product_id', $product->id)
                    ->get()
                    ->first(function ($variant) use ($attributes) {
                        foreach ($attributes as $key => $value) {
                            if (($variant->attributes[$key] ?? null) !== $value) {
                                return false;
                            }
                        }

                        return true;
                    });

                if (!$variant) {
                    continue;
                }

                PromotionItem::updateOrCreate([
                    'promotion_id' => $opening->id,
                    'product_id' => $product->id,
                    'variant_unique_key' => $variant->id,
                ], [
                    'promotion_id' => $opening->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'variant_unique_key' => $variant->id,
                    'discount_type' => 'fixed',
                    'discount_value' => $discount,
                    'limit_quantity' => max(1, min(150, (int) $variant->stock)),
                    'sold_quantity' => 0,
                    'reserved_quantity' => 0,
                    'is_active' => true,
                ]);
            }
        }
    }
}
