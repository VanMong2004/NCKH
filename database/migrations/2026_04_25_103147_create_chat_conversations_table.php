<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('guest_token', 100)->nullable();

            $table->string('title')->nullable();

            $table->enum('status', ['active', 'expired', 'closed'])
                ->default('active');

            $table->timestamp('last_message_at')->nullable();

            $table->timestamp('expired_at')
                ->nullable();

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'last_message_at']);
            $table->index(['guest_token', 'last_message_at']);
            $table->index(['status', 'last_message_at']);
            $table->index(['expired_at']);
            $table->index(['user_id', 'status', 'last_message_at']);
            $table->index(['guest_token', 'status', 'last_message_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_conversations');
    }
};