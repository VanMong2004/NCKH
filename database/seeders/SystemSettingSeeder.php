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
        SystemSetting::updateOrCreate([

            'maintenance_mode'=>false,

            'maintenance_message'=>
                'Hệ thống đang bảo trì',

            'session_timeout'=>120,

            'order_auto_cancel_minutes'=>null,
        ]);

        SystemSetting::updateOrCreate([

            'maintenance_mode'=>false,

            'maintenance_message'=>
                'Thời gian tự động hủy đơn',

            'session_timeout'=>null,

            'order_auto_cancel_minutes'=>15,
        ]);
    }
}
