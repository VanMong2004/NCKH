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
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->string('size')->nullable();
            $table->string('color')->nullable();

            $table->string('sku')->nullable()->unique();

            $table->decimal('price', 10, 2);

            $table->integer('stock')->default(0);
            $table->integer('reserved_stock')->default(0);
            $table->integer('sold_stock')->default(0);

            // constraint BEFORE timestamps (best practice)
            $table->unique(['product_id', 'size', 'color']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
