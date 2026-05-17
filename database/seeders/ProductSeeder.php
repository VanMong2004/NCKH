<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [

            [
                'name' => 'Áo CTU K2026',
                'category' => 'Áo thun',
                'featured' => true
            ],

            [
                'name' => 'Hoodie CTU Premium',
                'category' => 'Hoodie',
                'featured' => true
            ],

            [
                'name' => 'Áo khoa CNTT',
                'category' => 'Áo thun',
                'featured' => true
            ],

            [
                'name' => 'Ly giữ nhiệt CTU',
                'category' => 'Ly giữ nhiệt',
                'featured' => false
            ],

            [
                'name' => 'Móc khóa CTU',
                'category' => 'Móc khóa',
                'featured' => false
            ],

            [
                'name' => 'Túi tote CTU',
                'category' => 'Túi tote',
                'featured' => true
            ],

            [
                'name' => 'Nón CTU',
                'category' => 'Nón',
                'featured' => false
            ],

            [
                'name' => 'Bảng tên sinh viên',
                'category' => 'Bảng tên',
                'featured' => false
            ],

            [
                'name' => 'Sticker CTU',
                'category' => 'Phụ kiện',
                'featured' => false
            ],

            [
                'name' => 'Áo Freshman Week',
                'category' => 'Áo thun',
                'featured' => true
            ]

        ];

        foreach ($products as $item) {

            $category = Category::where(
                'name',
                $item['category']
            )->first();

            Product::updateOrCreate(
                [
                    'slug' => Str::slug(
                        $item['name']
                    )
                ],
                [
                    'category_id' => $category?->id,

                    'name' => $item['name'],

                    'slug' => Str::slug(
                        $item['name']
                    ),

                    'description' =>
                    'Sản phẩm chính thức của trường dành cho sinh viên.',

                    'is_featured' =>
                    $item['featured'],

                    'is_active' => true,

                    'average_rating' =>
                    rand(35,50)/10,

                    'total_reviews' =>
                    rand(5,120)
                ]
            );
        }
    }
}