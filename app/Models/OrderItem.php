<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Order;
use App\Models\ProductVariant;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_variant_id',
        'price',
        'quantity',
        'product_name',
        'variant_snapshot',
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
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
