<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $parents = [
            'Đồng phục' => 'images/categories/dong-phuc.jpg',
            'Phụ kiện' => 'images/categories/phu-kien.jpg',
            'Học tập' => 'images/categories/hoc-tap.jpg',
            'Sự kiện' => 'images/categories/su-kien.jpg',
            'Quà tặng' => 'images/categories/qua-tang.jpg',
        ];

        foreach ($parents as $name => $image) {
            Category::updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'parent_id' => null,
                    'icon' => null,
                    'image' => $image,
                    'thumbnail' => $image,
                ]
            );
        }

        $children = [
            'Đồng phục' => ['Áo thun', 'Hoodie', 'Áo khoác', 'Nón'],
            'Phụ kiện' => ['Móc khóa', 'Ly giữ nhiệt', 'Túi tote', 'Sticker', 'Dây đeo thẻ'],
            'Học tập' => ['Sổ tay', 'Bút', 'Bảng tên'],
            'Sự kiện' => ['Freshman Week', 'Ngày hội việc làm'],
            'Quà tặng' => ['Combo quà tặng'],
        ];

        foreach ($children as $parentName => $items) {
            $parent = Category::where('name', $parentName)->first();

            foreach ($items as $name) {
                Category::updateOrCreate(
                    ['slug' => Str::slug($name)],
                    [
                        'name' => $name,
                        'parent_id' => $parent?->id,
                        'icon' => null,
                        'image' => 'images/categories/' . Str::slug($name) . '.jpg',
                        'thumbnail' => 'images/categories/' . Str::slug($name) . '.jpg',
                    ]
                );
            }
        }
    }
}