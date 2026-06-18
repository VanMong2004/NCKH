<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteComponent extends Model
{
    protected $fillable = [
        'page_key',
        'page_name',
        'component_key',
        'component_name',
        'component_type',
        'title',
        'subtitle',
        'content',
        'image',
        'mobile_image',
        'payload',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'payload' => 'array',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(SiteComponentItem::class, 'component_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function activeItems(): HasMany
    {
        return $this->hasMany(SiteComponentItem::class, 'component_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function rootItems(): HasMany
    {
        return $this->hasMany(SiteComponentItem::class, 'component_id')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function activeRootItems(): HasMany
    {
        return $this->hasMany(SiteComponentItem::class, 'component_id')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePage($query, string $pageKey)
    {
        return $query->where('page_key', $pageKey);
    }

    public function scopeComponent($query, string $componentKey)
    {
        return $query->where('component_key', $componentKey);
    }
}