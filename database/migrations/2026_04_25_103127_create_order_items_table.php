<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('order_id')->nullable();
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->unsignedBigInteger('product_variant_id')->nullable();
            $table->foreign('product_variant_id')
                ->references('id')
                ->on('product_variants')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('campaign_item_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->index('campaign_item_id');

            $table->foreignId('user_campaign_item_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            

            // snapshot pricing
            $table->decimal('price', 10, 2);

            $table->unsignedInteger('quantity');

            // optional but recommended snapshot
            $table->string('product_name')->nullable();
            $table->json('variant_snapshot')->nullable();

            $table->decimal('original_price', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('final_price', 10, 2)->default(0);

            $table->unsignedBigInteger('promotion_id')->nullable();
            $table->json('promotion_snapshot')->nullable();

            $table->timestamps();

            $table->index('order_id');
            $table->index('product_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
