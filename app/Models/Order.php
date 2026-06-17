<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_code',
        'status',
        'expired_at',
        'cancel_reason',
        'total',
        'guest_token',
        'guest_name',
        'guest_email',
        'guest_phone',
        'shipping_fee',
        'shipping_name',
        'shipping_phone',
        'shipping_address',
        'sub_total',
        'discount_total',
        'grand_total',
    ];

    protected $casts = [
        'total' => 'float',
        'shipping_fee' => 'float',
        'created_at' => 'datetime',
        'expired_at' => 'datetime',
        'cancel_reason' => 'string',
        'sub_total' => 'float',
        'discount_total' => 'float',
        'grand_total' => 'float',
    ];

    // ========================
    // RELATIONSHIPS
    // ========================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
