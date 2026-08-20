<?php

namespace Tests\Unit;

use App\Models\ChatbotApprovedAnswer;
use App\Services\Chat\ChatbotApprovedAnswerService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ChatbotApprovedAnswerServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('chatbot_approved_answers');

        Schema::create('chatbot_approved_answers', function (Blueprint $table) {
            $table->id();
            $table->text('question');
            $table->text('normalized_question');
            $table->string('question_hash', 64)->nullable();
            $table->json('question_embedding')->nullable();
            $table->longText('answer');
            $table->string('intent')->default('static_knowledge');
            $table->string('intent_signature')->nullable();
            $table->json('entities_json')->nullable();
            $table->string('status')->default('draft');
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('use_count')->default(0);
            $table->timestamp('last_used_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->string('source_type')->nullable();
            $table->string('source_reference')->nullable();
            $table->timestamps();
        });
    }

    public function test_exact_match_updates_usage_fields(): void
    {
        $answer = ChatbotApprovedAnswer::query()->create([
            'question' => 'Chính sách đổi trả như thế nào?',
            'normalized_question' => 'chinh sach doi tra nhu the nao',
            'question_hash' => sha1('chinh sach doi tra nhu the nao'),
            'answer' => 'Bạn có thể đổi trả theo chính sách đã công bố.',
            'intent' => 'static_knowledge',
            'status' => 'approved',
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $matched = app(ChatbotApprovedAnswerService::class)->findBestMatch('Chính sách đổi trả như thế nào?', 'static_knowledge');

        $this->assertNotNull($matched);
        $this->assertSame('exact', $matched['match_type']);
        $this->assertSame($answer->id, $matched['id']);
        $this->assertEquals(1.0, $matched['confidence']);
        $this->assertSame(1, $answer->fresh()->use_count);
        $this->assertNotNull($answer->fresh()->last_used_at);
    }

    public function test_inactive_answer_is_not_used(): void
    {
        ChatbotApprovedAnswer::query()->create([
            'question' => 'Liên hệ ở đâu?',
            'normalized_question' => 'lien he o dau',
            'question_hash' => sha1('lien he o dau'),
            'answer' => 'Liên hệ tại đây.',
            'intent' => 'static_knowledge',
            'status' => 'approved',
            'is_active' => false,
            'approved_at' => now(),
        ]);

        $matched = app(ChatbotApprovedAnswerService::class)->findBestMatch('Liên hệ ở đâu?', 'static_knowledge');

        $this->assertNull($matched);
    }
}
