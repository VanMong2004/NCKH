<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Eloquent\SoftDeletes;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('slug')->unique();

            $table->unsignedBigInteger('category_id')->nullable();
            $table->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->unsignedBigInteger('department_id')->nullable();

            $table->text('description')->nullable();

            $table->string('author')->nullable();

            $table->boolean('is_active')->default(true);

            // optional but very useful
            $table->boolean('is_featured')->default(false);

            $table->decimal('average_rating', 3, 2)
                ->default(0);

            $table->unsignedInteger('total_reviews')
                ->default(0);

            $table->integer('sold_count')
                ->default(0);

            $table->integer('view_count')
                ->default(0);

            $table->softDeletes();

            $table->timestamps();

            $table->index(['is_active', 'created_at'], 'products_active_created_idx');
            $table->index(['is_active', 'is_featured', 'created_at'], 'products_featured_idx');
            $table->index(['is_active', 'category_id', 'created_at'], 'products_category_idx');
            $table->index(['is_active', 'department_id', 'created_at'], 'products_department_idx');
            $table->index(['is_active', 'sold_count'], 'products_sold_idx');
            $table->index(['is_active', 'average_rating'], 'products_rating_idx');
            $table->index(['is_active', 'view_count'], 'products_view_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
