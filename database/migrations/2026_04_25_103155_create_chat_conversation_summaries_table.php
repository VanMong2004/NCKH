<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversation_summaries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained('chat_conversations')
                ->cascadeOnDelete();

            $table->longText('summary');

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->unique('conversation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_conversation_summaries');
    }
};