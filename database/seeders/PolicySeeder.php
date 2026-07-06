<?php

namespace Database\Seeders;

use App\Models\Policy;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PolicySeeder extends Seeder
{
    public function run(): void
    {
        $policies = [
            ['Chính sách đổi trả', 'policy'],
            ['Chính sách vận chuyển', 'policy'],
            ['Chính sách bảo mật', 'policy'],
            ['Điều khoản sử dụng', 'terms'],
        ];

        foreach ($policies as $index => $item) {
            $slug = Str::slug($item[0]);

            Policy::updateOrCreate([
                'slug' => $slug,
            ], [
                'title' => $item[0],
                'slug' => $slug,
                'type' => $item[1],
                'content' => '<p>Nội dung đang được cập nhật.</p>',
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);
        }
    }
}
