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
        'campaign_item_id',
        'user_campaign_item_id',
        'product_name',
        'variant_snapshot',
        'price',
        'quantity',
    ];

    protected $casts = [
        'price' => 'float',
        'quantity' => 'integer',
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

    public function campaignItem()
    {
        return $this->belongsTo(CampaignItem::class);
    }

    public function userCampaignItem()
    {
        return $this->belongsTo(UserCampaignItem::class);
    }
}
