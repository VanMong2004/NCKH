<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $product = Product::create([
            'name' => 'Áo CTU',
            'slug' => 'ao-ctu',
            'category_id' => 2,
            'description' => 'Áo trường CTU',
        ]);

        $variants = [
            ['size' => 'M', 'color' => 'Trắng'],
            ['size' => 'L', 'color' => 'Đen'],
        ];

        foreach ($variants as $v) {
            ProductVariant::create([
                'product_id' => $product->id,
                'size' => $v['size'],
                'color' => $v['color'],
                'sku' => uniqid(),
                'price' => rand(100000, 200000),
                'stock' => 50,
            ]);
        }

        ProductImage::create([
            'product_id' => $product->id,
            'url' => 'data:image/png;base64,fakeimage123',
            'type' => 'thumbnail',
            'position' => 1,
        ]);
    }
}