<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    protected $fillable = [
        'conversation_id',
        'parent_message_id',
        'role',
        'content',
        'sources',
        'tool_calls',
        'metadata',
    ];

    protected $casts = [
        'sources' => 'array',
        'tool_calls' => 'array',
        'metadata' => 'array',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function parent()
    {
        return $this->belongsTo(ChatMessage::class, 'parent_message_id');
    }

    public function replies()
    {
        return $this->hasMany(ChatMessage::class, 'parent_message_id');
    }
}