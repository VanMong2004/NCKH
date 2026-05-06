<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'is_active', // 🔥 ADD
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
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

    // 🔥 helpers
    public function isActive()
    {
        return now()->between($this->start_date, $this->end_date);
    }
}