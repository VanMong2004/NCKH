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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();

            $table->boolean('maintenance_mode')
                ->default(false);

            $table->string('maintenance_message')
                ->nullable();

            $table->unsignedInteger('session_timeout')
                ->nullable()
                ->default(120);

            $table->unsignedInteger('order_auto_cancel_minutes')
                ->nullable()
                ->default(15);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
