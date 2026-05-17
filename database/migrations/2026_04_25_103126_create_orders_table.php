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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->enum('type', ['normal', 'campaign'])->default('normal');

            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('campaign_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // snapshot address
            $table->string('shipping_name');
            $table->string('shipping_phone');
            $table->text('shipping_address');

            // financial
            $table->decimal('total', 10, 2);
            $table->decimal('shipping_fee', 10, 2)->default(0);

            // status
            $table->enum('status', [
                'pending',
                'paid',
                'processing',
                'shipped',
                'completed',
                'cancelled'
            ])->default('pending');

            $table->string('cancel_reason')->nullable();

            $table->string('order_code')->unique();

            $table->timestamps();

            $table->index(['type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
