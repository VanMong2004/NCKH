<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $clothes = Category::create([
            'name' => 'Quần áo',
            'slug' => 'quan-ao',
        ]);

        Category::create([
            'name' => 'Áo thun',
            'slug' => 'ao-thun',
            'parent_id' => $clothes->id,
        ]);

        Category::create([
            'name' => 'Áo hoodie',
            'slug' => 'hoodie',
            'parent_id' => $clothes->id,
        ]);
    }
}