<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;

class ProductImageSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Product::all() as $product) {
            ProductImage::updateOrCreate([
                'product_id' => $product->id,
                'type' => 'thumbnail',
                'position' => 0,
            ], [
                'product_id' => $product->id,
                'url' => "images/products/{$product->slug}/thumbnail.jpg",
                'type' => 'thumbnail',
                'position' => 0,
            ]);

            $galleryCount = match ($product->category?->name) {
                'Áo thun', 'Hoodie', 'Freshman Week' => 4,
                'Ly giữ nhiệt', 'Túi tote', 'Nón' => 3,
                default => 2,
            };

            for ($i = 1; $i <= $galleryCount; $i++) {
                ProductImage::updateOrCreate([
                    'product_id' => $product->id,
                    'type' => 'gallery',
                    'position' => $i,
                ], [
                    'product_id' => $product->id,
                    'url' => "images/products/{$product->slug}/{$i}.jpg",
                    'type' => 'gallery',
                    'position' => $i,
                ]);
            }
        }
    }
}
