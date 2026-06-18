<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_component_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('component_id')
                ->constrained('site_components')
                ->cascadeOnDelete();

            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('site_component_items')
                ->cascadeOnDelete();

            $table->string('group_key', 100)->nullable();
            $table->string('item_key', 100)->nullable();
            $table->string('item_type', 80)->default('link');

            $table->string('label')->nullable();
            $table->string('title')->nullable();
            $table->string('subtitle')->nullable();
            $table->text('content')->nullable();

            $table->string('icon_key', 100)->nullable();

            $table->string('image')->nullable();
            $table->string('mobile_image')->nullable();

            $table->string('link_text')->nullable();
            $table->string('link_url')->nullable();
            $table->string('target', 30)->default('_self');

            $table->json('payload')->nullable();

            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['component_id', 'item_key']);

            $table->index(['component_id', 'group_key']);
            $table->index(['component_id', 'item_type']);
            $table->index(['component_id', 'is_active', 'sort_order']);
            $table->index(['parent_id']);
            $table->index(['sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_component_items');
    }
};