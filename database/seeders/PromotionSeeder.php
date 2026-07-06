<?php

namespace Database\Seeders;

use App\Models\Promotion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PromotionSeeder extends Seeder
{
    public function run(): void
    {
        $promotions = [
            [
                'title' => 'Chào tân sinh viên K2026',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'status' => 'active',
                'start_date' => now()->subDays(7),
                'end_date' => now()->addDays(30),
                'description' => 'Ưu đãi dành cho tân sinh viên khi mua đồng phục và phụ kiện nhập học.',
            ],
            [
                'title' => 'Tuần lễ khai giảng',
                'discount_type' => 'fixed',
                'discount_value' => 20000,
                'status' => 'active',
                'start_date' => now()->subDays(2),
                'end_date' => now()->addDays(10),
                'description' => 'Giảm trực tiếp cho một số sản phẩm phụ kiện trong tuần lễ khai giảng.',
            ],
            [
                'title' => 'Black Friday CTUT 2025',
                'discount_type' => 'percent',
                'discount_value' => 25,
                'status' => 'inactive',
                'start_date' => now()->subMonths(7),
                'end_date' => now()->subMonths(6),
                'description' => 'Chương trình khuyến mãi đã kết thúc.',
            ],
            [
                'title' => 'Flash Sale cuối tháng',
                'discount_type' => 'fixed',
                'discount_value' => 50000,
                'status' => 'draft',
                'start_date' => now()->addDays(5),
                'end_date' => now()->addDays(8),
                'description' => 'Chương trình đang chuẩn bị, chưa công khai.',
            ],
        ];

        foreach ($promotions as $promotion) {
            $slug = Str::slug($promotion['title']);

            Promotion::updateOrCreate([
                'slug' => $slug,
            ], [
                ...$promotion,
                'slug' => $slug,
                'banner' => 'images/promotions/' . $slug . '/banner.jpg',
                'thumbnail' => 'images/promotions/' . $slug . '/thumbnail.jpg',
                'is_active' => true,
            ]);
        }
    }
}
