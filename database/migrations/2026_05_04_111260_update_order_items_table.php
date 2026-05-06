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
        Schema::table('order_items', function (Blueprint $table) {

            // 🔥 campaign_item_id
            $table->foreignId('campaign_item_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete()
                ->after('product_variant_id');

            // 🔥 index
            $table->index('campaign_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('campaign_item_id');
        });
    }
};
