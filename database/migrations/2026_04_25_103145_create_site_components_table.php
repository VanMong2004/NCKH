<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_components', function (Blueprint $table) {
            $table->id();

            $table->string('page_key', 100)->default('home');
            $table->string('page_name', 150)->default('Trang chủ');

            $table->string('component_key', 100);
            $table->string('component_name', 150);
            $table->string('component_type', 80)->default('section');

            $table->string('title')->nullable();
            $table->string('subtitle')->nullable();
            $table->text('content')->nullable();

            $table->string('image')->nullable();
            $table->string('mobile_image')->nullable();

            $table->json('payload')->nullable();

            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['page_key', 'component_key']);

            $table->index(['page_key', 'is_active']);
            $table->index(['component_key', 'is_active']);
            $table->index(['component_type', 'is_active']);
            $table->index(['sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_components');
    }
};