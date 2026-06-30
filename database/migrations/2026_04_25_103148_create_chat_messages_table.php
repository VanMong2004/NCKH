<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained('chat_conversations')
                ->cascadeOnDelete();

            $table->foreignId('parent_message_id')
                ->nullable()
                ->constrained('chat_messages')
                ->nullOnDelete();

            $table->enum('role', [
                'user',
                'assistant',
                'system',
            ]);

            $table->longText('content');

            $table->json('sources')->nullable();

            $table->json('tool_calls')->nullable();

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
            $table->index(['conversation_id', 'parent_message_id']);
            $table->index(['role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};