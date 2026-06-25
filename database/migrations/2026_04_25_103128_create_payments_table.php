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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('order_id')->nullable();
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->enum('method', ['vnpay', 'momo', 'banking', 'baokim', 'mock', 'cod']);

            $table->enum('status', [
                'pending',
                'processing',
                'success',
                'failed',
                'refunded'
            ])->default('pending');

            $table->decimal('amount', 12, 2)->default(0);
            $table->json('meta')->nullable();

            $table->string('transaction_id')->nullable()->unique();

            $table->json('response_data')->nullable();

            $table->timestamps();

            $table->index('order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
