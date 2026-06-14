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
                'name' => 'Áo CTUT K2026',
                'category' => 'Áo thun',
                'featured' => true,
            ],
            [
                'name' => 'Hoodie CTUT Premium',
                'category' => 'Hoodie',
                'featured' => true,
            ],
            [
                'name' => 'Áo khoa CNTT',
                'category' => 'Áo thun',
                'featured' => true,
            ],
            [
                'name' => 'Ly giữ nhiệt CTUT',
                'category' => 'Ly giữ nhiệt',
                'featured' => false,
            ],
            [
                'name' => 'Móc khóa CTUT',
                'category' => 'Móc khóa',
                'featured' => false,
            ],
            [
                'name' => 'Túi tote CTUT',
                'category' => 'Túi tote',
                'featured' => true,
            ],
            [
                'name' => 'Nón CTUT',
                'category' => 'Nón',
                'featured' => false,
            ],
            [
                'name' => 'Bảng tên sinh viên CTUT',
                'category' => 'Bảng tên',
                'featured' => false,
            ],
            [
                'name' => 'Sticker CTUT',
                'category' => 'Phụ kiện',
                'featured' => false,
            ],
            [
                'name' => 'Áo Freshman Week CTUT',
                'category' => 'Áo thun',
                'featured' => true,
            ],
        ];

        foreach ($products as $item) {

            $category = Category::where(
                'name',
                $item['category']
            )->first();

            Product::updateOrCreate(
                [
                    'slug' => Str::slug($item['name']),
                ],
                [
                    'name' => $item['name'],
                    'slug' => Str::slug($item['name']),
                    'category_id' => $category?->id,

                    'description' =>
                        'Sản phẩm chính thức mang thương hiệu CTUT dành cho sinh viên và giảng viên.',

                    'author' => 'CTUT',

                    'is_active' => true,
                    'is_featured' => $item['featured'],

                    'average_rating' => rand(40, 50) / 10,
                    'total_reviews' => rand(5, 120),

                    'sold_count' => rand(10, 500),
                    'view_count' => rand(100, 5000),
                ]
            );
        }
    }
}