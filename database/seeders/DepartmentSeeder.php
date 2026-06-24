<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Khoa Công nghệ thông tin', 'code' => 'CNTT'],
            ['name' => 'Khoa Công nghệ thực phẩm và Công nghệ sinh học', 'code' => 'CNTP-CNSH'],
            ['name' => 'Khoa Cơ khí', 'code' => 'CK'],
            ['name' => 'Khoa Điện - Điện tử - Viễn thông', 'code' => 'DDT-VT'],
            ['name' => 'Khoa Xây dựng', 'code' => 'XD'],
            ['name' => 'Khoa Quản lý công nghiệp', 'code' => 'QLCN'],
            ['name' => 'Khoa Khoa học cơ bản', 'code' => 'KHCB'],
        ];

        foreach ($departments as $index => $department) {
            Department::updateOrCreate(
                ['code' => $department['code']],
                [
                    'name' => $department['name'],
                    'slug' => Str::slug($department['name']),
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ]
            );
        }
    }
}