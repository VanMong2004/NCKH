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
                'start_date' => now()->subDays(5),
                'end_date' => now()->addDays(30),
            ],

            [
                'title' => 'Tuần lễ khai giảng',
                'discount_type' => 'fixed',
                'discount_value' => 20000,
                'status' => 'active',
                'start_date' => now()->subDays(2),
                'end_date' => now()->addDays(10),
            ],

            [
                'title' => 'Sale phụ kiện CTUT',
                'discount_type' => 'percent',
                'discount_value' => 15,
                'status' => 'active',
                'start_date' => now()->subDay(),
                'end_date' => now()->addDays(15),
            ],

            [
                'title' => 'Black Friday CTUT',
                'discount_type' => 'percent',
                'discount_value' => 25,
                'status' => 'inactive',
                'start_date' => now()->subMonths(1),
                'end_date' => now()->subDays(20),
            ],

            [
                'title' => 'Flash Sale cuối tháng',
                'discount_type' => 'fixed',
                'discount_value' => 50000,
                'status' => 'draft',
                'start_date' => now()->addDays(5),
                'end_date' => now()->addDays(10),
            ],
        ];

        foreach ($promotions as $item) {
            Promotion::updateOrCreate(
                [
                    'slug' => Str::slug($item['title']),
                ],
                [
                    'title' => $item['title'],
                    'slug' => Str::slug($item['title']),
                    'description' => 'Chương trình khuyến mãi dành cho sinh viên và khách hàng CTUT.',

                    'banner' => 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',

                    'thumbnail' => 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600',

                    'discount_type' => $item['discount_type'],
                    'discount_value' => $item['discount_value'],

                    'start_date' => $item['start_date'],
                    'end_date' => $item['end_date'],

                    'status' => $item['status'],

                    'is_active' => true,
                ]
            );
        }
    }
}