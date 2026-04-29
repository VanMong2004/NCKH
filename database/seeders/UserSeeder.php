<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            [
                'id' => 1,
                'name' => 'Nguyễn Văn A',
                'email' => 'user@gmail.com',
                'email_verified_at' => now(),
                'password' => Hash::make('123456'),
                'role' => 'user',
                'avatar' => 'https://i.pravatar.cc/100?img=1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'name' => 'Trần Thị B',
                'email' => 'user2@gmail.com',
                'email_verified_at' => now(),
                'password' => Hash::make('123456'),
                'role' => 'user',
                'avatar' => 'https://i.pravatar.cc/100?img=2',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'name' => 'Lê Văn C',
                'email' => 'user3@gmail.com',
                'email_verified_at' => now(),
                'password' => Hash::make('123456'),
                'role' => 'user',
                'avatar' => 'https://i.pravatar.cc/100?img=3',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 4,
                'name' => 'Admin CTUT',
                'email' => 'admin@gmail.com',
                'email_verified_at' => now(),
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'avatar' => 'https://i.pravatar.cc/100?img=4',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
