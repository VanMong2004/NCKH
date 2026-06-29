<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_type', 50)->index();
            $table->string('visitor_id', 100)->nullable()->index();
            $table->string('session_id', 100)->nullable()->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('guest_token', 120)->nullable()->index();
            $table->string('entity_type', 50)->nullable()->index();
            $table->unsignedBigInteger('entity_id')->nullable()->index();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->string('url', 1000)->nullable();
            $table->string('referrer', 1000)->nullable();
            $table->string('ip_hash', 80)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->index();
            $table->timestamps();

            $table->index(['event_type', 'occurred_at']);
            $table->index(['visitor_id', 'occurred_at']);
            $table->index(['session_id', 'occurred_at']);
            $table->index(['user_id', 'event_type', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
