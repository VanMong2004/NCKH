<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatConversation extends Model
{
    protected $fillable = [
        'user_id',
        'guest_token',
        'title',
        'last_message_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'last_message_at' => 'datetime',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id')
            ->orderBy('created_at')
            ->orderBy('id');
    }

    public function latestMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id')
            ->latest()
            ->limit(20);
    }
}