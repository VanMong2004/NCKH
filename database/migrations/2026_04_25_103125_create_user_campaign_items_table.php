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
        Schema::create('user_campaign_items', function (Blueprint $table) {

            $table->id();

            $table->foreignId('user_campaign_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('campaign_item_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->integer('quantity');

            $table->integer('approved_quantity')
                ->default(0);

            $table->integer('paid_quantity')
                ->default(0);

            $table->integer('reserved_quantity')
                ->default(0);

            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'expired'
            ])->default('pending');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_campaign_items');
    }
};
