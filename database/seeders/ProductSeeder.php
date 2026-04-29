<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('products')->insert([
            [
                'name' => 'Áo sơ mi CTUT',
                'slug' => Str::slug('Áo sơ mi CTUT'),
                'category_id' => 1,
                'description' => 'Áo sơ mi đồng phục nam CTUT, chất liệu cotton thoáng mát.',
                'is_active' => true,
                'is_featured' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Áo thể dục CTUT',
                'slug' => Str::slug('Áo thể dục CTUT'),
                'category_id' => 2,
                'description' => 'Áo thể dục dành cho sinh viên, co giãn tốt.',
                'is_active' => true,
                'is_featured' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Balo CTUT',
                'slug' => Str::slug('Balo CTUT'),
                'category_id' => 3,
                'description' => 'Balo chính thức CTUT, chống nước, nhiều ngăn tiện lợi.',
                'is_active' => true,
                'is_featured' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sổ tay CTUT',
                'slug' => Str::slug('Sổ tay CTUT'),
                'category_id' => 4,
                'description' => 'Sổ tay ghi chép dành cho sinh viên.',
                'is_active' => true,
                'is_featured' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
