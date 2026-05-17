<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'banner',
        'thumbnail',
        'limit',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    protected $appends = [
        'status',
    ];

    // 🔥 relations
    public function items()
    {
        return $this->hasMany(CampaignItem::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function userCampaigns()
    {
        return $this->hasMany(UserCampaign::class);
    }

    // 🔥 helpers
    public function isActive()
    {
        return now()->between($this->start_date, $this->end_date);
    }

    // 🔥 accessor
    public function getStatusAttribute()
    {
        if (now()->lt($this->start_date)) {
            return 'upcoming';
        }

        if (
            now()->between(
                $this->start_date,
                $this->end_date
            )
        ) {
            return 'active';
        }

        return 'ended';
    }
}