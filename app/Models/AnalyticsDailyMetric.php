<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsDailyMetric extends Model
{
    protected $fillable = [
        'metric_date',
        'visitors_count',
        'sessions_count',
        'page_views_count',
        'product_views_count',
        'add_to_cart_count',
        'checkout_started_count',
        'purchase_completed_count',
        'bounce_sessions_count',
        'metadata',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'metadata' => 'array',
    ];
}
