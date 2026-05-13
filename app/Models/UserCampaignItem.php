<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCampaignItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_campaign_id',
        'campaign_item_id',
        'quantity',
        'approved_quantity',
        'paid_quantity',
        'reserved_quantity',
        'status',
    ];

    // ========================
    // RELATIONSHIPS
    // ========================

    public function userCampaign()
    {
        return $this->belongsTo(UserCampaign::class);
    }

    public function campaignItem()
    {
        return $this->belongsTo(CampaignItem::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    // ========================
    // HELPERS
    // ========================

    public function isApproved()
    {
        return $this->status === 'approved';
    }
}