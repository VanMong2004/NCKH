<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;

class ProductImageSeeder extends Seeder
{
    public function run(): void
    {
        $images = [

            'Áo CTU K2026' => [
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000',
                'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1000',
                'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1000'
            ],

            'Hoodie CTU Premium' => [
                'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000',
                'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1000',
                'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=1000'
            ],

            'Áo khoa CNTT' => [
                'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000',
                'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1000',
            ],

            'Ly giữ nhiệt CTU' => [
                'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=1000',
                'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=1000'
            ],

            'Móc khóa CTU' => [
                'https://images.unsplash.com/photo-1616628182509-6cba4b48a4b6?w=1000'
            ],

            'Túi tote CTU' => [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000',
                'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=1000'
            ],

            'Nón CTU' => [
                'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=1000'
            ],

            'Bảng tên sinh viên' => [
                'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1000'
            ],

            'Sticker CTU' => [
                'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1000'
            ],

            'Áo Freshman Week' => [
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000'
            ]
        ];

        foreach ($images as $productName => $urls) {

            $product = Product::where(
                'name',
                $productName
            )->first();

            if (!$product) {
                continue;
            }

            foreach ($urls as $index => $url) {

                ProductImage::create([

                    'product_id' => $product->id,

                    'url' => $url,

                    'type' => $index === 0
                        ? 'thumbnail'
                        : 'gallery'
                ]);
            }
        }
    }
}