<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_automation_logs', function (Blueprint $table) {
            $table->id();

            $table->string('trigger_type', 100); 
            // product_created, product_updated, promotion_created

            $table->string('entity_type', 100);
            // product, promotion

            $table->unsignedBigInteger('entity_id');

            $table->string('platform', 50)->nullable();
            // all, facebook, zalo

            $table->string('status', 50)->default('pending')->index();
            // pending, sending, sent, success, failed, skipped

            $table->json('payload')->nullable();

            $table->json('n8n_response')->nullable();

            $table->json('platform_response')->nullable();

            $table->text('error_message')->nullable();

            $table->unsignedInteger('attempts')->default(0);

            $table->timestamp('sent_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->index(['trigger_type', 'entity_type', 'entity_id']);
            $table->index(['platform', 'status']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_automation_logs');
    }
};