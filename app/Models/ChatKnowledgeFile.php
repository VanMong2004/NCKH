<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatKnowledgeFile extends Model
{
    protected $fillable = [
        'title',
        'description',
        'original_name',
        'mime_type',
        'size',
        'openai_file_id',
        'vector_store_id',
        'vector_store_file_id',
        'status',
        'error_message',
        'metadata',
        'is_active',
        'effective_from',
        'effective_to',
        'uploaded_by',
    ];

    protected $casts = [
        'size' => 'integer',
        'metadata' => 'array',
        'is_active' => 'boolean',
        'effective_from' => 'datetime',
        'effective_to' => 'datetime',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
