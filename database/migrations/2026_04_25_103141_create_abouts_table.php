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
        Schema::create('abouts', function (Blueprint $table) {
            $table->id();

            $table->string('title');

            $table->string('slogan')->nullable();

            $table->string('banner')->nullable();

            $table->longText('description')->nullable();

            $table->longText('mission')->nullable();

            $table->longText('vision')->nullable();

            $table->unsignedInteger('student_count')->default(0);

            $table->unsignedInteger('major_count')->default(0);

            $table->unsignedInteger('teacher_count')->default(0);

            $table->unsignedInteger('years_of_operation')->default(0);

            $table->json('gallery')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('abouts');
    }
};
