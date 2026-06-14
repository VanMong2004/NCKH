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
        $sizes = ['S', 'M', 'L', 'XL'];

        $colors = [
            'Trắng',
            'Đen',
            'Xanh dương',
            'Xám',
        ];

        foreach (Product::with('category')->get() as $product) {

            $categoryName = mb_strtolower(
                $product->category?->name ?? ''
            );

            /*
            |--------------------------------------------------------------------------
            | Chỉ áo thun và hoodie mới có size
            |--------------------------------------------------------------------------
            */
            $hasSize = in_array(
                $categoryName,
                [
                    'áo thun',
                    'hoodie',
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | Giá cơ bản theo danh mục
            |--------------------------------------------------------------------------
            */
            $basePrice = match ($categoryName) {

                'áo thun'      => rand(129000, 179000),

                'hoodie'       => rand(289000, 399000),

                'nón'          => rand(89000, 129000),

                'túi tote'     => rand(79000, 129000),

                'ly giữ nhiệt' => rand(149000, 249000),

                'bình nước'    => rand(99000, 159000),

                'dây đeo thẻ'  => rand(19000, 39000),

                'bảng tên'     => rand(29000, 49000),

                'sổ tay'       => rand(39000, 69000),

                'bút'          => rand(10000, 25000),

                'móc khóa'     => rand(25000, 49000),

                'sticker'      => rand(10000, 30000),

                default        => rand(50000, 150000),
            };

            /*
            |--------------------------------------------------------------------------
            | Sản phẩm quần áo
            |--------------------------------------------------------------------------
            */
            if ($hasSize) {

                $selectedColors = collect($colors)
                    ->shuffle()
                    ->take(rand(2, 4));

                foreach ($sizes as $size) {

                    foreach ($selectedColors as $color) {

                        $price = $basePrice + match ($size) {
                            'S'  => 0,
                            'M'  => 10000,
                            'L'  => 20000,
                            'XL' => 30000,
                        };

                        ProductVariant::updateOrCreate(
                            [
                                'product_id' => $product->id,
                                'size'       => $size,
                                'color'      => $color,
                            ],
                            [
                                'attributes' => json_encode([
                                    'material' => 'Cotton',
                                ]),

                                'sku' => sprintf(
                                    'CTUT-%04d-%s-%s',
                                    $product->id,
                                    $size,
                                    Str::upper(
                                        Str::slug($color)
                                    )
                                ),

                                'price' => $price,

                                'stock' => rand(50, 300),

                                'reserved_stock' => rand(0, 20),

                                'sold_stock' => rand(0, 100),
                            ]
                        );
                    }
                }

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Sản phẩm không có size
            |--------------------------------------------------------------------------
            */
            ProductVariant::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'size'       => null,
                    'color'      => null,
                ],
                [
                    'attributes' => null,

                    'sku' => sprintf(
                        'CTUT-%04d',
                        $product->id
                    ),

                    'price' => $basePrice,

                    'stock' => rand(30, 200),

                    'reserved_stock' => rand(0, 10),

                    'sold_stock' => rand(0, 50),
                ]
            );
        }
    }
}