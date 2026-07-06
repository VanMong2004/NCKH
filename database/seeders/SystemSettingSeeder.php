<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $current = SystemSetting::query()->first();

        if ($current) {
            $current->update([
                'maintenance_mode' => false,
                'maintenance_message' => 'Hệ thống đang bảo trì',
                'session_timeout' => 120,
                'order_auto_cancel_minutes' => null,
            ]);

            SystemSetting::query()
                ->where('id', '!=', $current->id)
                ->delete();

            return;
        }

        SystemSetting::create([
            'maintenance_mode' => false,
            'maintenance_message' => 'Thời gian tự động hủy đơn',
            'session_timeout' => null,
            'order_auto_cancel_minutes' => 15,
        ]);
    }
}
