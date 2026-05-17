<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'student@ctuet.edu.vn'],
            [
                'name' => 'Bùi Hữu Nhật',
                'password' => '123456',
                'phone' => '0901000001',
                'mssv' => 'B2200001',
                'role' => 'sinhvien',
                'avatar' => 'https://i.pravatar.cc/300?img=12',
            ]
        );

        User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Khách mua hàng',
                'password' => '123456',
                'phone' => '0901000002',
                'mssv' => null,
                'role' => 'user',
                'avatar' => 'https://i.pravatar.cc/300?img=21',
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@ctuet.edu.vn'],
            [
                'name' => 'Quản trị hệ thống',
                'password' => '123456',
                'phone' => '0901000003',
                'mssv' => null,
                'role' => 'admin',
                'avatar' => 'https://i.pravatar.cc/300?img=5',
            ]
        );
    }
}