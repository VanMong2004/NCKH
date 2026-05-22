<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Blog;
use Illuminate\Support\Str;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        Blog::truncate();

        $blogs = [

            [
                'title' => 'Khai giảng năm học 2026',
                'excerpt' => 'Trường tổ chức lễ khai giảng năm học mới cho sinh viên.',
                'content' => 'Nội dung chi tiết khai giảng...',
                'thumbnail' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000',
                'category' => 'news',
                'is_featured' => true,
            ],

            [
                'title' => 'Hướng dẫn đăng ký đồng phục K2026',
                'excerpt' => 'Các bước đăng ký đồng phục cho sinh viên.',
                'content' => 'Nội dung hướng dẫn...',
                'thumbnail' => 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1000',
                'category' => 'campaign',
            ],

            [
                'title' => 'Freshman Week 2026',
                'excerpt' => 'Chuỗi hoạt động dành cho tân sinh viên.',
                'content' => 'Nội dung sự kiện...',
                'thumbnail' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000',
                'category' => 'event',
            ],

            [
                'title' => 'Hướng dẫn thanh toán bằng Momo',
                'excerpt' => 'Các bước thanh toán bằng ví điện tử Momo.',
                'content' => 'Nội dung hướng dẫn...',
                'thumbnail' => 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=1000',
                'category' => 'guide',
            ],

        ];

        foreach ($blogs as $blog) {

            Blog::create([

                ...$blog,

                'slug' => Str::slug($blog['title']),

                'author_name' => 'Admin',

                'view_count' => rand(100,1000),

                'is_published' => true,

                'published_at' => now()
                    ->subDays(rand(1,30))
            ]);
        }
    }
}