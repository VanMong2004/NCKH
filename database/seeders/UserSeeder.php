<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Quản trị CTUT UniShop', 'email' => 'admin@ctuet.edu.vn', 'phone' => '0901000001', 'mssv' => null, 'role' => 'admin', 'avatar' => '/images/users/default_avatar.png'],
            ['name' => 'Bùi Hữu Nhật', 'email' => 'nhat.b2200001@ctuet.edu.vn', 'phone' => '0901000002', 'mssv' => 'B2200001', 'role' => 'user', 'avatar' => '/images/users/default_avatar.png'],
            ['name' => 'Nguyễn Minh Anh', 'email' => 'anh.b2200102@ctuet.edu.vn', 'phone' => '0901000003', 'mssv' => 'B2200102', 'role' => 'user', 'avatar' => '/images/users/default_avatar.png'],
            ['name' => 'Trần Quốc Bảo', 'email' => 'bao.b2300221@ctuet.edu.vn', 'phone' => '0901000004', 'mssv' => 'B2300221', 'role' => 'user', 'avatar' => '/images/users/default_avatar.png'],
            ['name' => 'Lê Thảo Vy', 'email' => 'vy.b2400305@ctuet.edu.vn', 'phone' => '0901000005', 'mssv' => 'B2400305', 'role' => 'user', 'avatar' => '/images/users/default_avatar.png'],
            ['name' => 'Phạm Gia Hân', 'email' => 'han.b2500411@ctuet.edu.vn', 'phone' => '0901000006', 'mssv' => 'B2500411', 'role' => 'user', 'avatar' => '/images/users/default_avatar.png'],
            ['name' => 'Đặng Hoàng Nam', 'email' => 'nam.b2300440@ctuet.edu.vn', 'phone' => '0901000007', 'mssv' => 'B2300440', 'role' => 'user', 'avatar' => '/images/users/default_avatar.png'],
            ['name' => 'Khách mua hàng', 'email' => 'user@example.com', 'phone' => '0901000008', 'mssv' => null, 'role' => 'user', 'avatar' => '/images/users/default_avatar.png'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    ...$user,
                    'password' => Hash::make('123456'),
                    'email_verified_at' => now()->subDays(30),
                ]
            );
        }
    }
}
