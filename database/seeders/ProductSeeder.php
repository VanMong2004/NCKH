<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['name' => 'Áo thun CTUT K2026', 'category' => 'Áo thun', 'department' => null, 'author' => 'CTUT UniShop', 'featured' => true],
            ['name' => 'Hoodie CTUT Premium', 'category' => 'Hoodie', 'department' => null, 'author' => 'CTUT UniShop', 'featured' => true],
            ['name' => 'Áo khoa CNTT', 'category' => 'Áo thun', 'department' => 'CNTT', 'author' => 'Khoa Công nghệ thông tin', 'featured' => true],
            ['name' => 'Áo khoa Cơ khí', 'category' => 'Áo thun', 'department' => 'CK', 'author' => 'Khoa Cơ khí', 'featured' => false],
            ['name' => 'Áo khoa Điện - Điện tử', 'category' => 'Áo thun', 'department' => 'DDT-VT', 'author' => 'Khoa Điện - Điện tử - Viễn thông', 'featured' => false],
            ['name' => 'Áo Freshman Week 2026', 'category' => 'Freshman Week', 'department' => null, 'author' => 'Ban tổ chức Freshman Week 2026', 'featured' => true],
            ['name' => 'Ly giữ nhiệt CTUT', 'category' => 'Ly giữ nhiệt', 'department' => null, 'author' => 'CTUT UniShop', 'featured' => true],
            ['name' => 'Túi tote CTUT', 'category' => 'Túi tote', 'department' => null, 'author' => 'CTUT UniShop', 'featured' => true],
            ['name' => 'Nón lưỡi trai CTUT', 'category' => 'Nón', 'department' => null, 'author' => 'CTUT UniShop', 'featured' => false],
            ['name' => 'Móc khóa CTUT', 'category' => 'Móc khóa', 'department' => null, 'author' => 'CTUT UniShop', 'featured' => false],
            ['name' => 'Sticker CTUT', 'category' => 'Sticker', 'department' => null, 'author' => 'CTUT UniShop', 'featured' => false],
            ['name' => 'Bảng tên sinh viên CTUT', 'category' => 'Bảng tên', 'department' => null, 'author' => 'Phòng Công tác Chính trị và Quản lý sinh viên', 'featured' => false],
            ['name' => 'Dây đeo thẻ CTUT', 'category' => 'Dây đeo thẻ', 'department' => null, 'author' => 'Đoàn Thanh niên CTUT', 'featured' => false],
            ['name' => 'Sổ tay CTUT', 'category' => 'Sổ tay', 'department' => null, 'author' => 'CTUT UniShop', 'featured' => false],
            ['name' => 'Bút CTUT', 'category' => 'Bút', 'department' => null, 'author' => 'CTUT UniShop', 'featured' => false],
        ];

        foreach ($products as $item) {
            $category = Category::where('name', $item['category'])->first();
            $department = $item['department']
                ? Department::where('code', $item['department'])->first()
                : null;

            Product::updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'name' => $item['name'],
                    'slug' => Str::slug($item['name']),
                    'category_id' => $category?->id,
                    'department_id' => $department?->id,
                    'description' => 'Sản phẩm chính thức của CTUT UniShop dành cho sinh viên, giảng viên và các hoạt động của Trường Đại học Kỹ thuật - Công nghệ Cần Thơ.',
                    'author' => $item['author'],
                    'is_active' => true,
                    'is_featured' => $item['featured'],
                    'average_rating' => 0,
                    'total_reviews' => 0,
                    'sold_count' => 0,
                    'view_count' => 0,
                ]
            );
        }
    }
}
