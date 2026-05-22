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
        Schema::create('blogs', function (Blueprint $table) {
            $table->id();

            $table->string('title');

            $table->string('slug')->unique();

            $table->text('excerpt')->nullable();

            $table->longText('content')->nullable();

            $table->string('thumbnail')->nullable();

            $table->string('category')->default('news');

            $table->string('author_name')->default('Admin');

            $table->boolean('is_featured')->default(false);

            $table->boolean('is_published')->default(true);

            $table->unsignedInteger('view_count')->default(0);

            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blogs');
    }
};
