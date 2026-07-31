<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            if (!Schema::hasColumn('contacts', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('status');
            }

            if (!Schema::hasColumn('contacts', 'replied_at')) {
                $table->timestamp('replied_at')->nullable()->after('admin_note');
            }

            if (!Schema::hasColumn('contacts', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        DB::statement("ALTER TABLE contacts MODIFY status VARCHAR(50) NOT NULL DEFAULT 'pending'");
        DB::table('contacts')->where('status', 'resolved')->update(['status' => 'replied']);

        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'description')) {
                $table->text('description')->nullable()->after('slug');
            }

            if (!Schema::hasColumn('categories', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('thumbnail');
            }

            if (!Schema::hasColumn('categories', 'sort_order')) {
                $table->unsignedInteger('sort_order')->default(0)->after('is_active');
            }
        });

        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'description')) {
                $table->text('description')->nullable()->after('code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'description')) {
                $table->dropColumn('description');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            foreach (['description', 'is_active', 'sort_order'] as $column) {
                if (Schema::hasColumn('categories', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('contacts', function (Blueprint $table) {
            foreach (['admin_note', 'replied_at', 'deleted_at'] as $column) {
                if (Schema::hasColumn('contacts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
