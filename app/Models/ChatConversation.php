<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ChatConversation extends Model
{
    protected $fillable = [
        'user_id',
        'guest_token',
        'title',
        'last_message_at',
        'metadata',
        'context_state',
        'status',
        'expired_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'context_state' => 'array',
        'last_message_at' => 'datetime',
        'expired_at' => 'datetime',
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

    public function summary(): HasOne
    {
        return $this->hasOne(ChatConversationSummary::class, 'conversation_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
