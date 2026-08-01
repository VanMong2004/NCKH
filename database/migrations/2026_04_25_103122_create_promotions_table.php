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
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            $table->string('banner')->nullable();
            $table->string('thumbnail')->nullable();

            $table->enum('discount_type', [
                'percent',
                'fixed',
            ])->nullable();

            $table->decimal('discount_value', 12, 2)->nullable();

            $table->timestamp('start_date');
            $table->timestamp('end_date');

            $table->enum('status', [
                'draft',
                'active',
                'inactive',
            ])->default('draft');

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['start_date', 'end_date']);
            $table->index(['status', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
