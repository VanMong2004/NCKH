<?php

namespace Tests\Unit;

use App\Services\Chat\ContextualReferenceResolver;
use App\Services\Chat\ConversationMemoryService;
use App\Services\Chat\OpenAiHybridRagChatService;
use App\Services\Chat\OpenAiStaticKnowledgeService;
use App\Services\Chat\ProductChatToolService;
use App\Services\Chat\ChatSessionService;
use Mockery;
use Tests\TestCase;

class OpenAiHybridRagChatServiceIntentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.openai.intent_classifier_enabled', false);
    }

    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    public function test_it_routes_shipping_policy_to_static_knowledge(): void
    {
        $entities = $this->extractEntities('chinh sach van chuyen');

        $this->assertSame('static_knowledge', $entities['intent']);
    }

    public function test_it_routes_general_purchase_question_to_static_knowledge(): void
    {
        $entities = $this->extractEntities('mua hang');

        $this->assertSame('static_knowledge', $entities['intent']);
    }

    public function test_it_routes_gift_request_to_product_search(): void
    {
        $entities = $this->extractEntities('Tôi muốn tìm sản phẩm làm quà tặng');

        $this->assertSame('product_search', $entities['intent']);
        $this->assertSame('qua tang', $entities['category_query']);
    }

    private function extractEntities(string $message): array
    {
        $service = new OpenAiHybridRagChatService(
            Mockery::mock(ProductChatToolService::class),
            Mockery::mock(ChatSessionService::class),
            Mockery::mock(OpenAiStaticKnowledgeService::class),
            Mockery::mock(ConversationMemoryService::class),
            Mockery::mock(ContextualReferenceResolver::class)
        );

        $method = new \ReflectionMethod($service, 'extractEntities');
        $method->setAccessible(true);

        return $method->invoke($service, $message);
    }
}
