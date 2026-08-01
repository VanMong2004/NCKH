<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            if (!Schema::hasColumn('blogs', 'author_id')) {
                $table->foreignId('author_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('blogs', 'summary')) {
                $table->text('summary')->nullable()->after('slug');
            }

            if (!Schema::hasColumn('blogs', 'status')) {
                $table->enum('status', ['draft', 'published'])->default('draft')->after('thumbnail');
            }
        });

        DB::table('blogs')->update([
            'summary' => DB::raw('COALESCE(summary, excerpt)'),
        ]);

        DB::table('blogs')
            ->where('is_published', 1)
            ->update([
                'status' => 'published',
                'published_at' => DB::raw('COALESCE(published_at, created_at)'),
            ]);

        DB::table('blogs')
            ->where('is_published', 0)
            ->update([
                'status' => 'draft',
            ]);

        Schema::table('blogs', function (Blueprint $table) {
            $table->index(['status', 'published_at'], 'blogs_status_published_at_index');
            $table->index(['is_featured', 'status'], 'blogs_featured_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->dropIndex('blogs_status_published_at_index');
            $table->dropIndex('blogs_featured_status_index');

            if (Schema::hasColumn('blogs', 'author_id')) {
                $table->dropConstrainedForeignId('author_id');
            }

            if (Schema::hasColumn('blogs', 'summary')) {
                $table->dropColumn('summary');
            }

            if (Schema::hasColumn('blogs', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
