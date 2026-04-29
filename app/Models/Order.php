<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\OrderItem;
use App\Models\Payment;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'shipping_name',
        'shipping_phone',
        'shipping_address',
        'status',
        'total',
        'shipping_fee',
        'order_code',
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

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
