<?php

namespace Database\Seeders;

use App\Models\About;
use Illuminate\Database\Seeder;

class AboutSeeder extends Seeder
{
    public function run(): void
    {
        About::updateOrCreate(['is_active' => true], [
            'title' => 'CTUT Store',
            'slogan' => 'Kết nối sinh viên CTUT',
            'banner' => 'images/about/banner.jpg',

            'description' =>
                'CTUT Store là cửa hàng chính thức của Trường Đại học Kỹ thuật - Công nghệ Cần Thơ.',

            'mission' =>
                'Mang đến sản phẩm chất lượng cho sinh viên và giảng viên.',

            'vision' =>
                'Trở thành hệ thống phân phối sản phẩm chính thức của CTUT.',

            'student_count' => 0,
            'major_count' => 0,
            'teacher_count' => 0,
            'years_of_operation' => 0,

            'gallery' => [
                'images/about/1.jpg',
                'images/about/2.jpg',
                'images/about/3.jpg',
            ],

            'is_active' => true,
        ]);
    }
}
