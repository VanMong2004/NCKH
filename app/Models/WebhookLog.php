<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebhookLog extends Model
{
    protected $fillable = [
        'event',
        'payload',
        'status',
        'response',
    ];

    protected $casts = [
        'payload' => 'array',
        'response' => 'array',
    ];
}
