<?php

namespace Tests\Unit;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Services\Chat\ConversationMemoryService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ConversationMemoryServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');

        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('guest_token', 100)->nullable();
            $table->string('title')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->json('metadata')->nullable();
            $table->json('context_state')->nullable();
            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('conversation_id');
            $table->unsignedBigInteger('parent_message_id')->nullable();
            $table->string('role');
            $table->longText('content');
            $table->json('sources')->nullable();
            $table->json('tool_calls')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function test_it_persists_promotion_context_by_canonical_id(): void
    {
        $conversation = ChatConversation::query()->create([
            'title' => 'Hội thoại AI',
            'status' => 'active',
            'last_message_at' => now(),
        ]);

        $assistant = ChatMessage::query()->create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => 'Danh sách khuyến mãi',
            'metadata' => [
                'intent' => 'promotion_query',
                'promotions' => [
                    ['id' => 14, 'title' => 'Flash Sale cuối tuần CTUT'],
                    ['id' => 17, 'title' => 'Chào tân sinh viên K2026'],
                ],
            ],
        ]);

        $service = app(ConversationMemoryService::class);
        $state = $service->updateFromAssistantMessage($conversation, $assistant);

        $this->assertSame(14, data_get($state, 'topics.promotion.last_list.0.id'));
        $this->assertSame(1, data_get($state, 'topics.promotion.last_list.0.position'));
        $this->assertSame(17, data_get($state, 'topics.promotion.last_list.1.id'));
    }
}
