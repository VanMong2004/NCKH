<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsEvent extends Model
{
    public const PAGE_VIEW = 'page_view';
    public const PRODUCT_VIEW = 'product_view';
    public const ADD_TO_CART = 'add_to_cart';
    public const CHECKOUT_STARTED = 'checkout_started';
    public const PURCHASE_COMPLETED = 'purchase_completed';

    protected $fillable = [
        'event_type',
        'visitor_id',
        'session_id',
        'user_id',
        'guest_token',
        'entity_type',
        'entity_id',
        'product_id',
        'product_variant_id',
        'order_id',
        'url',
        'referrer',
        'ip_hash',
        'user_agent',
        'metadata',
        'occurred_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'occurred_at' => 'datetime',
    ];
}
