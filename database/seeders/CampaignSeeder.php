<?php

namespace Database\Seeders;

use App\Models\Campaign;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CampaignSeeder extends Seeder
{
    public function run(): void
    {
        $campaigns = [
            [
                'title' => 'Đăng ký đồng phục K2026',
                'description' => 'Campaign đăng ký đồng phục chính thức dành cho tân sinh viên K2026.',
                'banner' => 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200',
                'thumbnail' => 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600',
                'limit' => 1000,
                'start_date' => now()->subDays(3),
                'end_date' => now()->addDays(7),
                'is_active' => true,
            ],
            [
                'title' => 'Áo khoa Công nghệ thông tin',
                'description' => 'Đăng ký áo khoa CNTT cho sinh viên các khóa.',
                'banner' => 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200',
                'thumbnail' => 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600',
                'limit' => 500,
                'start_date' => now()->subDays(1),
                'end_date' => now()->addDays(5),
                'is_active' => true,
            ],
            [
                'title' => 'Hoodie CTU mùa đông',
                'description' => 'Campaign đặt trước hoodie CTU phiên bản mùa đông.',
                'banner' => 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200',
                'thumbnail' => 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600',
                'limit' => 300,
                'start_date' => now()->addDays(3),
                'end_date' => now()->addDays(14),
                'is_active' => true,
            ],
            [
                'title' => 'Tuần lễ tân sinh viên',
                'description' => 'Đăng ký bộ sản phẩm sự kiện dành cho tân sinh viên.',
                'banner' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
                'thumbnail' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600',
                'limit' => 800,
                'start_date' => now()->addDays(5),
                'end_date' => now()->addDays(20),
                'is_active' => true,
            ],
            [
                'title' => 'Merchandise CTU tháng trước',
                'description' => 'Campaign cũ đã kết thúc.',
                'banner' => 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200',
                'thumbnail' => 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600',
                'limit' => 400,
                'start_date' => now()->subDays(20),
                'end_date' => now()->subDays(5),
                'is_active' => true,
            ],
        ];

        foreach ($campaigns as $item) {
            Campaign::updateOrCreate(
                [
                    'slug' => Str::slug($item['title']),
                ],
                [
                    'title' => $item['title'],
                    'slug' => Str::slug($item['title']),
                    'description' => $item['description'],
                    'banner' => $item['banner'],
                    'thumbnail' => $item['thumbnail'],
                    'limit' => $item['limit'],
                    'start_date' => $item['start_date'],
                    'end_date' => $item['end_date'],
                    'is_active' => $item['is_active'],
                ]
            );
        }
    }
}