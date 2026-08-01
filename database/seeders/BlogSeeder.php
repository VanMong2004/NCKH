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
            'Huong dan dat hang tren CTUT UniShop',
            'Huong dan nhan hang tai Phong Cong tac Chinh tri va Quan ly sinh vien',
            'Cac phuong thuc thanh toan duoc ho tro',
            'Quy trinh yeu cau xuat hoa don',
            'Thong bao ra mat san pham dong phuc CTUT moi',
            'Thong bao chuong trinh khuyen mai dau nam hoc',
        ];

        foreach ($blogs as $index => $title) {
            $slug = Str::slug($title);

            Blog::updateOrCreate([
                'slug' => $slug,
            ], [
                'title' => $title,
                'slug' => $slug,
                'summary' => $title,
                'content' => "<p>{$title}</p>",
                'thumbnail' => 'images/blogs/' . ($index + 1) . '.jpg',
                'status' => 'published',
                'is_featured' => $index < 2,
                'published_at' => now()->subDays($index),
            ]);
        }
    }
}
