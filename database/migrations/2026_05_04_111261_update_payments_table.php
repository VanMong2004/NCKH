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
        Schema::table('payments', function (Blueprint $table) {

            // 🔥 thêm amount nếu chưa có
            if (!Schema::hasColumn('payments', 'amount')) {
                $table->decimal('amount', 12, 2)
                    ->default(0)
                    ->after('status');
            }

            // 🔥 thêm meta (dùng thay response_data nếu muốn)
            if (!Schema::hasColumn('payments', 'meta')) {
                $table->json('meta')
                    ->nullable()
                    ->after('amount');
            }

            // 🔥 mở rộng method (nếu cần)
            // ⚠️ ENUM sửa trong MySQL hơi khó → nếu cần mình sẽ xử lý sau
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {

            if (Schema::hasColumn('payments', 'amount')) {
                $table->dropColumn('amount');
            }

            if (Schema::hasColumn('payments', 'meta')) {
                $table->dropColumn('meta');
            }
        });
    }
};
