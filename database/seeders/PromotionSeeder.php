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
                'is_active' => true,
                'start_date' => now()->subDays(7),
                'end_date' => now()->addDays(21),
                'description' => 'Khuyến mãi đang diễn ra cho các sản phẩm chào năm học mới.',
            ],
            [
                'title' => 'Flash Sale cuối tuần CTUT',
                'discount_type' => 'fixed',
                'discount_value' => 15000,
                'status' => 'active',
                'is_active' => true,
                'start_date' => now()->subHours(12),
                'end_date' => now()->addHours(20),
                'description' => 'Khuyến mãi sắp kết thúc để demo bộ lọc còn dưới 1 ngày.',
            ],
            [
                'title' => 'Tuần lễ khai giảng sắp tới',
                'discount_type' => 'percent',
                'discount_value' => 12,
                'status' => 'active',
                'is_active' => true,
                'start_date' => now()->addDays(4),
                'end_date' => now()->addDays(10),
                'description' => 'Khuyến mãi sắp diễn ra để demo bộ lọc thời gian.',
            ],
            [
                'title' => 'Black Friday CTUT 2025',
                'discount_type' => 'percent',
                'discount_value' => 25,
                'status' => 'active',
                'is_active' => true,
                'start_date' => now()->subMonths(8),
                'end_date' => now()->subMonths(7),
                'description' => 'Khuyến mãi đã kết thúc để demo bộ lọc lịch sử.',
            ],
            [
                'title' => 'Ưu đãi nội bộ chờ duyệt',
                'discount_type' => 'fixed',
                'discount_value' => 10000,
                'status' => 'draft',
                'is_active' => false,
                'start_date' => now()->addDays(12),
                'end_date' => now()->addDays(18),
                'description' => 'Khuyến mãi bản nháp dành cho giao diện quản trị.',
            ],
            [
                'title' => 'Đợt ưu đãi tạm dừng',
                'discount_type' => 'percent',
                'discount_value' => 8,
                'status' => 'inactive',
                'is_active' => false,
                'start_date' => now()->subDays(2),
                'end_date' => now()->addDays(5),
                'description' => 'Khuyến mãi đã tắt để demo trạng thái quản trị.',
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
            ]);
        }
    }
}
