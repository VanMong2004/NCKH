<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('reviews')->insert([
            // Product 1
            [
                'user_id' => 1,
                'product_id' => 1,
                'rating' => 5,
                'content' => 'Áo đẹp, chất vải thoáng mát, rất đáng tiền.',
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 2,
                'product_id' => 1,
                'rating' => 4,
                'content' => 'Form áo chuẩn, mặc thoải mái.',
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Product 2
            [
                'user_id' => 1,
                'product_id' => 2,
                'rating' => 4,
                'content' => 'Áo thể dục co giãn tốt, phù hợp tập luyện.',
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Product 3
            [
                'user_id' => 2,
                'product_id' => 3,
                'rating' => 5,
                'content' => 'Balo chắc chắn, nhiều ngăn tiện lợi.',
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Product 4
            [
                'user_id' => 3,
                'product_id' => 4,
                'rating' => 4,
                'content' => 'Sổ đẹp, giấy dày, viết rất thích.',
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
