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
            'Đồng phục' => 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
            'Phụ kiện' => 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800',
            'Bảng tên' => 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800',
            'Sự kiện' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
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
            'Đồng phục' => ['Áo thun', 'Áo khoác', 'Hoodie'],
            'Phụ kiện' => ['Móc khóa', 'Ly giữ nhiệt', 'Túi tote', 'Nón'],
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
                        'image' => 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
                        'thumbnail' => 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
                    ]
                );
            }
        }
    }
}