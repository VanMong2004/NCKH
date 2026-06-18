<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteComponentItem extends Model
{
    protected $fillable = [
        'component_id',
        'parent_id',
        'group_key',
        'item_key',
        'item_type',
        'label',
        'title',
        'subtitle',
        'content',
        'icon_key',
        'image',
        'mobile_image',
        'link_text',
        'link_url',
        'target',
        'payload',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'payload' => 'array',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function component(): BelongsTo
    {
        return $this->belongsTo(SiteComponent::class, 'component_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(SiteComponentItem::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(SiteComponentItem::class, 'parent_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function activeChildren(): HasMany
    {
        return $this->hasMany(SiteComponentItem::class, 'parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeGroup($query, string $groupKey)
    {
        return $query->where('group_key', $groupKey);
    }

    public function scopeType($query, string $itemType)
    {
        return $query->where('item_type', $itemType);
    }
}