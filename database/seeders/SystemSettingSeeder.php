<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SystemSetting;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SystemSetting::create([

            'maintenance_mode'=>false,

            'maintenance_message'=>
                'Hệ thống đang bảo trì',

            'session_timeout'=>120
        ]);
    }
}
