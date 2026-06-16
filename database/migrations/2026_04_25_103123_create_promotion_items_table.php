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
        Schema::create('promotion_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('promotion_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('product_variant_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->enum('discount_type', [
                'percent',
                'fixed',
            ])->nullable();

            $table->decimal('discount_value', 12, 2)
                ->nullable();

            $table->unsignedInteger('limit_quantity')
                ->nullable();

            $table->unsignedInteger('sold_quantity')
                ->default(0);

            $table->unsignedInteger('reserved_quantity')
                ->default(0);

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->unique([
                'promotion_id',
                'product_id',
                'product_variant_id',
            ], 'promotion_product_variant_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_items');
    }
};
