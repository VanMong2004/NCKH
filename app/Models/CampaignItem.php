<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CampaignItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'product_variant_id',
        'price',
        'registered_quantity',
    ];

    protected $casts = [
        'price' => 'float',
        'registered_quantity' => 'integer',
    ];

    // 🔥 relations
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function product()
    {
        return $this->productVariant->product();
    }
}