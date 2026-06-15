<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_variant_id',
        'product_name',
        'variant_snapshot',
        'price',
        'quantity',
        'original_price',
        'discount_amount',
        'final_price',
        'promotion_id',
        'promotion_snapshot',
    ];

    protected $casts = [
        'price' => 'float',
        'quantity' => 'integer',
        'variant_snapshot' => 'array',
        'original_price' => 'float',
        'discount_amount' => 'float',
        'final_price' => 'float',
        'promotion_snapshot' => 'array',
    ];

    // ========================
    // RELATIONSHIPS
    // ========================

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

}
