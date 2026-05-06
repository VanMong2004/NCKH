<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {

            // Drop FK nếu tồn tại
            try {
                $table->dropForeign(['user_id']);
            } catch (\Exception $e) {}

            try {
                $table->dropForeign(['product_id']);
            } catch (\Exception $e) {}

            // Drop unique
            try {
                $table->dropUnique('reviews_user_id_product_id_unique');
            } catch (\Exception $e) {}

            // 🔥 thêm order_item_id
            $table->foreignId('order_item_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            // 🔥 unique mới (đúng business)
            $table->unique(['user_id', 'order_item_id']);
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {

            $table->dropUnique(['user_id', 'order_item_id']);
            $table->dropConstrainedForeignId('order_item_id');

            // restore lại (optional)
            $table->unique(['user_id', 'product_id']);
        });
    }
};