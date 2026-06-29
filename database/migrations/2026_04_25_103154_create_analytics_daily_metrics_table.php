<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_daily_metrics', function (Blueprint $table) {
            $table->id();
            $table->date('metric_date')->unique();
            $table->unsignedInteger('visitors_count')->default(0);
            $table->unsignedInteger('sessions_count')->default(0);
            $table->unsignedInteger('page_views_count')->default(0);
            $table->unsignedInteger('product_views_count')->default(0);
            $table->unsignedInteger('add_to_cart_count')->default(0);
            $table->unsignedInteger('checkout_started_count')->default(0);
            $table->unsignedInteger('purchase_completed_count')->default(0);
            $table->unsignedInteger('bounce_sessions_count')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_daily_metrics');
    }
};
