<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialAutomationLog extends Model
{
    protected $fillable = [
        'trigger_type',
        'entity_type',
        'entity_id',
        'platform',
        'status',
        'payload',
        'n8n_response',
        'platform_response',
        'error_message',
        'attempts',
        'sent_at',
        'completed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'n8n_response' => 'array',
        'platform_response' => 'array',
        'attempts' => 'integer',
        'sent_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
}