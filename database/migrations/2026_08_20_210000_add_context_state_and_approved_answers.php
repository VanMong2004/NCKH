<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_conversations', function (Blueprint $table) {
            $table->json('context_state')->nullable()->after('metadata');
        });

        Schema::table('chat_knowledge_files', function (Blueprint $table) {
            $table->timestamp('effective_from')->nullable()->after('is_active');
            $table->timestamp('effective_to')->nullable()->after('effective_from');
            $table->index(['is_active', 'effective_from', 'effective_to'], 'chat_knowledge_validity_idx');
        });

        Schema::create('chatbot_approved_answers', function (Blueprint $table) {
            $table->id();
            $table->text('question');
            $table->text('normalized_question');
            $table->string('question_hash', 64)->index();
            $table->json('question_embedding')->nullable();
            $table->longText('answer');
            $table->string('intent', 100)->default('static_knowledge')->index();
            $table->string('intent_signature')->nullable()->index();
            $table->json('entities_json')->nullable();
            $table->enum('status', ['draft', 'approved'])->default('draft')->index();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedBigInteger('use_count')->default(0);
            $table->timestamp('last_used_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->string('source_type')->nullable()->index();
            $table->string('source_reference')->nullable();
            $table->timestamps();

            $table->index(['status', 'is_active', 'effective_from', 'effective_to'], 'chatbot_answer_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_approved_answers');

        Schema::table('chat_knowledge_files', function (Blueprint $table) {
            $table->dropIndex('chat_knowledge_validity_idx');
            $table->dropColumn(['effective_from', 'effective_to']);
        });

        Schema::table('chat_conversations', function (Blueprint $table) {
            $table->dropColumn('context_state');
        });
    }
};
