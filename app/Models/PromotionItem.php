<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PromotionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'promotion_id',
        'product_id',
        'product_variant_id',
        'discount_type',
        'discount_value',
        'limit_quantity',
        'sold_quantity',
        'reserved_quantity',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'limit_quantity' => 'integer',
        'sold_quantity' => 'integer',
        'reserved_quantity' => 'integer',
        'is_active' => 'boolean',
    ];

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function hasLimit(): bool
    {
        return !is_null($this->limit_quantity);
    }

    public function isSoldOut(): bool
    {
        return $this->hasLimit()
            && $this->sold_quantity >= $this->limit_quantity;
    }

    // Số lượng còn lại có thể bán (chưa bao gồm reserved)
    public function getRemainingQuantityAttribute()
    {
        if (is_null($this->limit_quantity)) {
            return null;
        }

        return max(
            0,
            $this->limit_quantity
            - $this->sold_quantity
            - $this->reserved_quantity
        );
    }
}