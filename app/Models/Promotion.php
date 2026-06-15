<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Promotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'banner',
        'thumbnail',
        'discount_type',
        'discount_value',
        'start_date',
        'end_date',
        'status',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'computed_status',
    ];

    public function items()
    {
        return $this->hasMany(PromotionItem::class);
    }

    public function activeItems()
    {
        return $this->hasMany(PromotionItem::class)
            ->where('is_active', true);
    }

    public function isRunning(): bool
    {
        return $this->is_active
            && $this->status === 'active'
            && now()->between($this->start_date, $this->end_date);
    }

    public function getComputedStatusAttribute(): string
    {
        if (now()->lt($this->start_date)) {
            return 'upcoming';
        }

        if (now()->between($this->start_date, $this->end_date)) {
            return 'active';
        }

        return 'ended';
    }
}