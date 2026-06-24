<?php

namespace Database\Seeders;

use App\Models\Blog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $blogs = [

            'Ra mắt bộ đồng phục CTUT K2026',

            'Khai trương CTUT Store',

            'Freshman Week 2026 chính thức bắt đầu',

            'Top sản phẩm bán chạy tháng này',

            'Hướng dẫn chọn size áo CTUT',

            'Chính sách đổi trả mới',
        ];

        foreach ($blogs as $index => $title) {

            Blog::create([
                'title' => $title,
                'slug' => Str::slug($title),
                'excerpt' => $title,
                'content' => "<p>{$title}</p>",
                'thumbnail' => "images/blogs/" . ($index + 1) . ".jpg",
                'category' => 'news',
                'author_name' => 'CTUT Store',
                'is_featured' => $index < 2,
                'is_published' => true,
                'view_count' => 1000 + ($index * 500),
                'published_at' => now()->subDays($index),
            ]);
        }
    }
}