<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\About;

class AboutSeeder extends Seeder
{
    public function run(): void
    {
        About::truncate();

        About::create([
            'title' => 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',

            'slogan' => 'Tri thức - Công nghệ - Sáng tạo',

            'banner' => 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400',

            'description' => 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ là cơ sở đào tạo định hướng ứng dụng trong lĩnh vực kỹ thuật, công nghệ và đổi mới sáng tạo.',

            'mission' => 'Đào tạo nguồn nhân lực có năng lực chuyên môn, kỹ năng thực hành và khả năng thích ứng với môi trường nghề nghiệp hiện đại.',

            'vision' => 'Trở thành trường đại học định hướng ứng dụng có uy tín trong lĩnh vực kỹ thuật và công nghệ tại khu vực Đồng bằng sông Cửu Long.',

            'student_count' => 8000,

            'major_count' => 20,

            'teacher_count' => 350,

            'years_of_operation' => 12,

            'gallery' => [
                'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1000',
                'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1000',
                'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1000',
            ],

            'is_active' => true,
        ]);
    }
}