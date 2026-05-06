<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'campaign_id',
        'type',
        'order_code',
        'status',
        'cancel_reason',
        'total',
        'shipping_fee',
        'shipping_name',
        'shipping_phone',
        'shipping_address',
    ];

    protected $casts = [
        'total' => 'float',
        'shipping_fee' => 'float',
        'created_at' => 'datetime',
        'cancel_reason' => 'string',
    ];

    // ========================
    // RELATIONSHIPS
    // ========================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // 🔥 scopes
    public function scopeNormal($query)
    {
        return $query->where('type', 'normal');
    }

    public function scopeCampaign($query)
    {
        return $query->where('type', 'campaign');
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    public function isCampaign()
    {
        return $this->type === 'campaign';
    }

    public function isNormal()
    {
        return $this->type === 'normal';
    }
}
