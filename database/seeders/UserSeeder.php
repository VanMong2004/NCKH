<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@ctuet.edu.vn',
            'password' => '123456',
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Sinh viên 1',
            'email' => 'sv1@student.ctuet.edu.vn',
            'password' => '123456',
            'role' => 'user',
        ]);

        User::create([
            'name' => 'User thường',
            'email' => 'user@gmail.com',
            'password' => '123456',
            'role' => 'user',
        ]);
    }
}