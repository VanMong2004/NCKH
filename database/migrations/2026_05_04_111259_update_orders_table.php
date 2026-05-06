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
        Schema::table('orders', function (Blueprint $table) {
            // 🔥 type: normal | campaign
            $table->enum('type', ['normal', 'campaign'])
                ->default('normal')
                ->after('id');

            // 🔥 campaign_id
            $table->foreignId('campaign_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete()
                ->after('user_id');

            // 🔥 index
            $table->index(['type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('type');
            $table->dropConstrainedForeignId('campaign_id');
        });
    }
};
