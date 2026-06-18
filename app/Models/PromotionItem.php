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
        'variant_unique_key',
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
        'variant_unique_key' => 'integer',
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

    // Số lượng còn lại có thể reserve, đã trừ sold và reserved
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

    public function canReserve(int $quantity): bool
    {
        if (!$this->hasLimit()) {
            return true;
        }

        return ($this->sold_quantity + $this->reserved_quantity + $quantity)
            <= $this->limit_quantity;
    }
}