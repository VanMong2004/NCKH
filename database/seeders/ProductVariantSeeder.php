<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductVariantSeeder extends Seeder
{
    public function run(): void
    {
        $sizes = ['S','M','L','XL'];

        $colors = [
            'Trắng',
            'Đen',
            'Xanh dương',
            'Xám'
        ];

        foreach(Product::all() as $product){

            $basePrice = rand(
                99000,
                299000
            );

            foreach($sizes as $size){

                foreach(
                    array_rand(
                        array_flip($colors),
                        rand(2,4)
                    ) as $color
                ){
                    $sku = strtoupper(Str::slug($product->slug))
                        . '-'
                        . $size
                        . '-'
                        . Str::upper(Str::slug($color));

                    ProductVariant::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'size' => $size,
                            'color' => $color,
                        ],
                        [
                            'sku' => $sku,
                            'price' => $basePrice + match ($size) {
                                'S' => 0,
                                'M' => 10000,
                                'L' => 20000,
                                'XL' => 30000,
                            },
                            'stock' => rand(50, 300),
                            'reserved_stock' => rand(0, 20),
                            'sold_stock' => rand(0, 100),
                        ]
                    );
                }
            }
        }
    }
}