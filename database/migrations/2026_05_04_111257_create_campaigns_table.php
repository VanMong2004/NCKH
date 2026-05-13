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
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->text('description')->nullable();

            $table->string('banner')
                ->nullable();

            $table->string('thumbnail')
                ->nullable();

            $table->unsignedInteger('limit')
                ->nullable();

            $table->timestamp('start_date');
            $table->timestamp('end_date');

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // 🔥 index
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
