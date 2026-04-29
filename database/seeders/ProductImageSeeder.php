<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductImageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('product_images')->insert([
            // Product 1
            [
                'product_id' => 1,
                'url' => 'https://aoxuanhe.com/upload/product/axh-095/ao-so-mi-nam-cong-so-trang-dep.jpg',
                'type' => 'thumbnail',
                'position' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 1,
                'url' => 'https://dongphuchaianh.com/wp-content/uploads/2022/07/ao-so-mi-trang-nam.jpg',
                'type' => 'gallery',
                'position' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Product 2
            [
                'product_id' => 2,
                'url' => 'https://img.pikbest.com/png-images/20241024/navy-blue-sweater-png-transparent-background-3d_11000390.png',
                'type' => 'thumbnail',
                'position' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 2,
                'url' => 'https://ann.com.vn/wp-content/uploads/24713_trang_20240719111643.png',
                'type' => 'gallery',
                'position' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Product 3
            [
                'product_id' => 3,
                'url' => 'https://cdn.tgdd.vn/Products/Images/42/258498/balo-laptop-15-6-inch-lenovo-b210-1.jpg',
                'type' => 'thumbnail',
                'position' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 3,
                'url' => 'https://product.hstatic.net/1000360022/product/balo_1_1024x1024.jpg',
                'type' => 'gallery',
                'position' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Product 4
            [
                'product_id' => 4,
                'url' => 'https://haycafe.vn/wp-content/uploads/2022/06/Hinh-anh-hoc-bai.jpg',
                'type' => 'thumbnail',
                'position' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
