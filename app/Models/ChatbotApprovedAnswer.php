<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatbotApprovedAnswer extends Model
{
    protected $table = 'chatbot_approved_answers';

    protected $fillable = [
        'question',
        'normalized_question',
        'question_hash',
        'question_embedding',
        'answer',
        'intent',
        'intent_signature',
        'entities_json',
        'status',
        'is_active',
        'use_count',
        'last_used_at',
        'approved_by',
        'approved_at',
        'effective_from',
        'effective_to',
        'source_type',
        'source_reference',
    ];

    protected $casts = [
        'question_embedding' => 'array',
        'entities_json' => 'array',
        'is_active' => 'boolean',
        'use_count' => 'integer',
        'last_used_at' => 'datetime',
        'approved_at' => 'datetime',
        'effective_from' => 'datetime',
        'effective_to' => 'datetime',
    ];

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
