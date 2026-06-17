<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'maintenance_mode',
        'maintenance_message',
        'session_timeout',
        'order_auto_cancel_minutes',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
        'order_auto_cancel_minutes' => 'integer',
    ];
}