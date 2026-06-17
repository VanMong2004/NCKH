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
        Schema::create('inventory_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_variant_id')
                ->constrained('product_variants')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('actor_id')->nullable();

            $table->string('type'); 
            // admin_adjust | checkout_reserve | order_release | order_completed

            $table->integer('stock_before')->default(0);
            $table->integer('stock_after')->default(0);

            $table->integer('reserved_before')->default(0);
            $table->integer('reserved_after')->default(0);

            $table->integer('sold_before')->default(0);
            $table->integer('sold_after')->default(0);

            $table->integer('quantity')->default(0);

            $table->unsignedBigInteger('order_id')->nullable();
            $table->string('note')->nullable();

            $table->timestamps();

            $table->index('product_variant_id');
            $table->index('actor_id');
            $table->index('order_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_histories');
    }
};
