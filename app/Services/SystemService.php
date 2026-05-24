<?php

namespace App\Services;

use App\Models\SystemSetting;

class SystemService
{
    public function getState()
    {
        $setting = SystemSetting::first();

        return [
            'maintenance' => [
                'enabled' => $setting?->maintenance_mode ?? false,
                'message' => $setting?->maintenance_message ?? null,
            ],

            'session' => [
                'timeout_minutes' => $setting?->session_timeout ?? 120,
            ],
        ];
    }
}