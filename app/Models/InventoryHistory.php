<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryHistory extends Model
{
    protected $fillable = [
        'product_variant_id',
        'actor_id',
        'type',
        'stock_before',
        'stock_after',
        'reserved_before',
        'reserved_after',
        'sold_before',
        'sold_after',
        'quantity',
        'order_id',
        'note',
    ];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}