<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('categories')->insert([
            [
                'name' => 'Nam',
                'slug' => 'male',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Nữ',
                'slug' => 'female',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Phụ kiện',
                'slug' => 'accessory',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Học tập',
                'slug' => 'study',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
