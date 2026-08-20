<?php

namespace Tests\Unit;

use App\Models\ChatConversation;
use App\Services\Chat\ContextualReferenceResolver;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ContextualReferenceResolverTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

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
    }

    public function test_it_resolves_promotion_ordinal_from_structured_memory(): void
    {
        $conversation = ChatConversation::query()->create([
            'title' => 'AI',
            'status' => 'active',
            'last_message_at' => now(),
            'context_state' => [
                'topics' => [
                    'promotion' => [
                        'last_list' => [
                            ['type' => 'promotion', 'position' => 1, 'id' => 14, 'name' => 'Flash Sale cuối tuần CTUT'],
                            ['type' => 'promotion', 'position' => 2, 'id' => 17, 'name' => 'Chào tân sinh viên K2026'],
                        ],
                    ],
                ],
            ],
        ]);

        $result = app(ContextualReferenceResolver::class)->resolve($conversation, 'các sản phẩm trong đợt số 1');

        $this->assertTrue($result['matched']);
        $this->assertSame('promotion', $result['entity_type']);
        $this->assertSame(14, $result['entity_id']);
        $this->assertSame('ordinal', $result['reference_type']);
    }

    public function test_unrelated_turns_do_not_delete_existing_context_state(): void
    {
        $conversation = ChatConversation::query()->create([
            'title' => 'AI',
            'status' => 'active',
            'last_message_at' => now(),
            'context_state' => [
                'topics' => [
                    'promotion' => [
                        'last_list' => [
                            ['type' => 'promotion', 'position' => 1, 'id' => 14, 'name' => 'Flash Sale cuối tuần CTUT'],
                        ],
                    ],
                ],
            ],
        ]);

        $result = app(ContextualReferenceResolver::class)->resolve($conversation, 'đợt 1');

        $this->assertTrue($result['matched']);
        $this->assertSame(14, $result['entity_id']);
    }

    public function test_typo_without_reference_signal_does_not_leak_old_context(): void
    {
        $conversation = ChatConversation::query()->create([
            'title' => 'AI',
            'status' => 'active',
            'last_message_at' => now(),
            'context_state' => [
                'topics' => [
                    'promotion' => [
                        'last_list' => [
                            ['type' => 'promotion', 'position' => 1, 'id' => 14, 'name' => 'Flash Sale cuối tuần CTUT'],
                        ],
                    ],
                ],
            ],
        ]);

        $result = app(ContextualReferenceResolver::class)->resolve($conversation, 'av');

        $this->assertFalse($result['matched']);
        $this->assertFalse($result['has_reference_signal']);
    }
}
