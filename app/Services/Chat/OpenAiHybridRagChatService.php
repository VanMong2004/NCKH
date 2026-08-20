<?php

namespace App\Services\Chat;

use App\Jobs\SummarizeChatConversationJob;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use JsonException;
use RuntimeException;
use Throwable;

class OpenAiHybridRagChatService
{
    private const GPT_INTENT_ALLOWLIST = [
        'small_talk',
        'order_query',
        'promotion_query',
        'off_topic',
        'static_knowledge',
        'clarify',
        'product_price',
        'product_stock',
        'product_variant',
        'product_search',
        'rag',
        'unknown',
    ];

    public function __construct(
        protected ProductChatToolService $productToolService,
        protected ChatSessionService $sessionService,
        protected OpenAiStaticKnowledgeService $staticKnowledgeService,
        protected ConversationMemoryService $conversationMemoryService,
        protected ContextualReferenceResolver $contextualReferenceResolver
    ) {}

    public function sendMessage($user, ?string $guestToken, ?int $conversationId, string $message): array
    {
        $message = trim($message);

        if ($message === '') {
            throw new RuntimeException('Vui lòng nhập nội dung cần tư vấn', 422);
        }

        $guestToken = $this->sessionService->normalizeGuestToken($user, $guestToken);

        [$conversation, $userMessage] = DB::transaction(function () use ($user, $guestToken, $conversationId, $message) {
            $conversation = $this->resolveConversation($user, $guestToken, $conversationId, $message);

            $userMessage = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'user',
                'content' => $message,
            ]);

            $this->sessionService->touchSession($conversation);

            return [$conversation, $userMessage];
        });

        $openAiResult = $this->askOpenAi($conversation, $user, $message);

        $result = DB::transaction(function () use ($conversation, $userMessage, $openAiResult) {
            $assistantMessage = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'parent_message_id' => $userMessage->id,
                'role' => 'assistant',
                'content' => $openAiResult['answer'],
                'sources' => $openAiResult['sources'],
                'tool_calls' => $openAiResult['tool_calls'],
                'metadata' => [
                    'response_id' => $openAiResult['response_id'],
                    'model' => config('services.openai.chat_model'),
                    'intent' => $openAiResult['intent'] ?? 'unknown',
                    'debug' => $openAiResult['debug'] ?? [],
                    'products' => $openAiResult['products'] ?? [],
                    'promotions' => $openAiResult['promotions'] ?? [],
                    'answer_source' => $openAiResult['answer_source'] ?? null,
                    'confidence' => $openAiResult['confidence'] ?? null,
                    'context_reference' => $openAiResult['context_reference'] ?? null,
                ],
            ]);

            $this->conversationMemoryService->updateFromAssistantMessage($conversation, $assistantMessage);

            $this->sessionService->touchSession($conversation);

            return [
                'conversation_id' => $conversation->id,
                'guest_token' => $conversation->guest_token,
                'parent_message_id' => $userMessage->id,
                'message_id' => $assistantMessage->id,
                'answer' => $assistantMessage->content,
                'sources' => $openAiResult['sources'] ?? [],
                'tool_calls' => $openAiResult['tool_calls'] ?? [],
                'products' => $openAiResult['products'] ?? [],
                'promotions' => $openAiResult['promotions'] ?? [],
            ];
        });

        $this->dispatchSummaryJobIfNeeded($conversation->id);

        return $result;
    }

    public function conversations($user, ?string $guestToken = null)
    {
        $guestToken = $this->sessionService->normalizeGuestToken($user, $guestToken);

        $query = ChatConversation::query()
            ->withCount('messages')
            ->where('status', 'active')
            ->latest('last_message_at')
            ->latest();

        if ($user) {
            $query->where('user_id', $user->id);
        } else {
            $query->where('guest_token', $guestToken);
        }

        return $query->get()
            ->map(fn ($conversation) => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'status' => $conversation->status,
                'guest_token' => $conversation->guest_token,
                'last_message_at' => optional($conversation->last_message_at)->format('d/m/Y H:i'),
                'messages_count' => (int) $conversation->messages_count,
            ])
            ->values();
    }

    public function currentSession($user, ?string $guestToken = null): array
    {
        $conversation = $this->sessionService->currentSession($user, $guestToken);

        return $this->sessionService->formatSession($conversation);
    }

    public function currentMessages($user, ?string $guestToken = null, int $limit = 20): array
    {
        $conversation = $this->sessionService->currentSession($user, $guestToken);
        $messages = $this->sessionService->recentMessages($conversation, $limit);

        return [
            ...$this->sessionService->formatSession($conversation),
            'messages' => $this->sessionService->formatMessages($messages),
        ];
    }

    public function resetSession($user, ?string $guestToken = null): array
    {
        $conversation = $this->sessionService->resetSession($user, $guestToken);

        return [
            ...$this->sessionService->formatSession($conversation),
            'messages' => [],
        ];
    }

    public function translateToVietnamese(string $text): array
    {
        $text = trim($text);

        if ($text === '') {
            throw new RuntimeException('Nội dung cần dịch không hợp lệ', 422);
        }

        $response = $this->createResponse([
            'model' => config('services.openai.chat_model'),
            'instructions' => 'Dịch nội dung người dùng gửi sang tiếng Việt tự nhiên, rõ ràng. Chỉ trả về bản dịch, không giải thích thêm.',
            'input' => [
                [
                    'role' => 'user',
                    'content' => $text,
                ],
            ],
            'max_output_tokens' => 500,
        ]);

        return [
            'translation' => $this->extractAnswer($response),
        ];
    }

    public function conversationDetail($user, ?string $guestToken, int $conversationId): array
    {
        $conversation = $this->sessionService->findOwnedSession($user, $guestToken, $conversationId);
        $messages = $this->sessionService->recentMessages($conversation, 20);

        if (!$conversation) {
            throw new RuntimeException('Không tìm thấy hội thoại', 404);
        }

        return [
            'id' => $conversation->id,
            'title' => $conversation->title,
            'status' => $conversation->status,
            'guest_token' => $conversation->guest_token,
            'messages' => $this->sessionService->formatMessages($messages),
        ];
    }

    private function resolveConversation($user, string $guestToken, ?int $conversationId, string $message): ChatConversation
    {
        if ($conversationId) {
            $conversation = $this->sessionService->findOwnedSession($user, $guestToken, $conversationId);

            if (!$conversation) {
                throw new RuntimeException('Không tìm thấy hội thoại', 404);
            }

            return $conversation;
        }

        return $this->sessionService->currentSession($user, $guestToken, $message);
    }

    private function dispatchSummaryJobIfNeeded(int $conversationId): void
    {
        $threshold = (int) config('services.openai.chat_summary_threshold', 30);

        $messageCount = ChatMessage::query()
            ->where('conversation_id', $conversationId)
            ->whereIn('role', ['user', 'assistant'])
            ->count();

        if ($messageCount >= $threshold && $messageCount % 10 === 0) {
            SummarizeChatConversationJob::dispatch($conversationId);
        }
    }

    private function ownedConversationQuery($user, ?string $guestToken)
    {
        $query = ChatConversation::query();

        if ($user) {
            return $query->where('user_id', $user->id);
        }

        return $query->where('guest_token', $guestToken);
    }

    private function askOpenAi(ChatConversation $conversation, $user, string $latestMessage): array
    {
        $startedAt = microtime(true);
        $entities = $this->extractEntities($latestMessage);
        $intent = $entities['intent'];
        $reference = $this->contextualReferenceResolver->resolve($conversation, $latestMessage);

        if (($reference['matched'] ?? false) && ($resolved = $this->handleResolvedReference($reference, $latestMessage, $user, $entities)) !== null) {
            return [
                ...$resolved,
                'debug' => [
                    'intent' => $resolved['intent'] ?? $intent,
                    'original_message' => $entities['original_message'] ?? $latestMessage,
                    'normalized_message' => $reference['normalized_message'] ?? ($entities['normalized_message'] ?? null),
                    'entities' => $entities,
                    'confidence' => $entities['confidence'],
                    'source_used' => 'conversation_memory',
                    'context_reference' => $reference,
                    'tool_count' => count($resolved['tool_calls'] ?? []),
                    'tool_names' => collect($resolved['tool_calls'] ?? [])->pluck('name')->unique()->values()->toArray(),
                    'product_count' => count($resolved['products'] ?? []),
                    'promotion_count' => count($resolved['promotions'] ?? []),
                    'source_count' => 0,
                    'tool_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                    'total_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                    'resolution' => $reference['reference_type'] ?? 'context',
                ],
                'answer_source' => 'database',
                'confidence' => $reference['confidence'] ?? null,
                'context_reference' => $reference,
            ];
        }

        if (
            ($reference['has_reference_signal'] ?? false)
            && !($reference['matched'] ?? false)
            && in_array($intent, ['clarify', 'unknown'], true)
            && !in_array($intent, ['small_talk', 'off_topic'], true)
        ) {
            return [
                ...$this->dynamicEmptyResponse(
                    'clarify',
                    [],
                    'Mình chưa chắc bạn đang nói đến mục nào trong ngữ cảnh trước đó. Bạn có thể nói rõ tên chương trình hoặc số thứ tự giúp mình không?'
                ),
                'debug' => [
                    'intent' => 'clarify',
                    'original_message' => $entities['original_message'] ?? $latestMessage,
                    'normalized_message' => $reference['normalized_message'] ?? ($entities['normalized_message'] ?? null),
                    'entities' => $entities,
                    'confidence' => $entities['confidence'],
                    'source_used' => 'clarify',
                    'context_reference' => $reference,
                    'tool_count' => 0,
                    'tool_names' => [],
                    'product_count' => 0,
                    'promotion_count' => 0,
                    'source_count' => 0,
                    'tool_duration_ms' => 0,
                    'total_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                    'resolution' => 'ambiguous',
                ],
                'answer_source' => 'clarify',
                'confidence' => $reference['confidence'] ?? null,
                'context_reference' => $reference,
            ];
        }

        if ($intent === 'off_topic') {
            return [
                ...$this->offTopicResponse($entities),
                'debug' => [
                    'intent' => 'off_topic',
                    'original_message' => $entities['original_message'] ?? $latestMessage,
                    'normalized_message' => $entities['normalized_message'] ?? null,
                    'entities' => $entities,
                    'confidence' => $entities['confidence'],
                    'source_used' => 'guard',
                    'tool_count' => 0,
                    'tool_names' => [],
                    'product_count' => 0,
                    'promotion_count' => 0,
                    'source_count' => 0,
                    'tool_duration_ms' => 0,
                    'total_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                ],
            ];
        }

        if ($intent === 'small_talk') {
            return [
                ...$this->smallTalkResponse($entities),
                'debug' => [
                    'intent' => 'small_talk',
                    'original_message' => $entities['original_message'] ?? $latestMessage,
                    'normalized_message' => $entities['normalized_message'] ?? null,
                    'entities' => $entities,
                    'confidence' => $entities['confidence'],
                    'source_used' => 'small_talk',
                    'tool_count' => 0,
                    'tool_names' => [],
                    'product_count' => 0,
                    'promotion_count' => 0,
                    'source_count' => 0,
                    'tool_duration_ms' => 0,
                    'total_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                ],
            ];
        }

        if (in_array($intent, ['clarify', 'unknown'], true)) {
            $contextualResult = $this->resolveContextualFollowUp($conversation, $latestMessage, $user, $entities);

            if ($contextualResult !== null) {
                return [
                    ...$contextualResult,
                    'debug' => [
                        'intent' => $contextualResult['intent'] ?? $intent,
                        'original_message' => $entities['original_message'] ?? $latestMessage,
                        'normalized_message' => $entities['normalized_message'] ?? null,
                        'entities' => $entities,
                        'confidence' => $entities['confidence'],
                        'source_used' => 'conversation_context',
                        'tool_count' => count($contextualResult['tool_calls'] ?? []),
                        'tool_names' => collect($contextualResult['tool_calls'] ?? [])->pluck('name')->unique()->values()->toArray(),
                        'product_count' => count($contextualResult['products'] ?? []),
                        'promotion_count' => count($contextualResult['promotions'] ?? []),
                        'source_count' => 0,
                        'tool_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                        'total_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                    ],
                ];
            }

            return [
                ...$this->clarifyResponse($entities),
                'debug' => [
                    'intent' => $intent,
                    'original_message' => $entities['original_message'] ?? $latestMessage,
                    'normalized_message' => $entities['normalized_message'] ?? null,
                    'entities' => $entities,
                    'confidence' => $entities['confidence'],
                    'source_used' => 'clarify',
                    'tool_count' => 0,
                    'tool_names' => [],
                    'product_count' => 0,
                    'promotion_count' => 0,
                    'source_count' => 0,
                    'tool_duration_ms' => 0,
                    'total_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                ],
            ];
        }

        if (!in_array($intent, ['rag', 'static_knowledge'], true)) {
            $result = $this->handleDynamicIntent($intent, $latestMessage, $user, $entities);

            return [
                ...$result,
                'debug' => [
                    'intent' => $result['intent'] ?? $intent,
                    'original_message' => $entities['original_message'] ?? $latestMessage,
                    'normalized_message' => $entities['normalized_message'] ?? null,
                    'entities' => $entities,
                    'confidence' => $entities['confidence'],
                    'source_used' => ($result['intent'] ?? $intent) === 'clarify' ? 'clarify' : 'database',
                    'tool_count' => count($result['tool_calls'] ?? []),
                    'tool_names' => collect($result['tool_calls'] ?? [])->pluck('name')->unique()->values()->toArray(),
                    'product_count' => count($result['products'] ?? []),
                    'promotion_count' => count($result['promotions'] ?? []),
                    'source_count' => 0,
                    'tool_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                    'total_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                ],
            ];
        }

        $result = $this->staticKnowledgeService->answer($conversation, $latestMessage);
        $debug = $result['debug'] ?? [];

        return [
            ...$result,
            'products' => [],
            'promotions' => [],
            'debug' => [
                ...$debug,
                'intent' => $result['intent'] ?? 'static_knowledge',
                'original_message' => $entities['original_message'] ?? $latestMessage,
                'normalized_message' => $entities['normalized_message'] ?? null,
                'entities' => $entities,
                'confidence' => $entities['confidence'],
                'source_used' => $debug['source_used'] ?? 'vector_store',
                'tool_count' => count($result['tool_calls'] ?? []),
                'tool_names' => collect($result['tool_calls'] ?? [])->pluck('name')->unique()->values()->toArray(),
                'product_count' => 0,
                'promotion_count' => 0,
                'source_count' => count($result['sources'] ?? []),
                'prompt_id_used' => (bool) ($debug['prompt_id_used'] ?? false),
                'tool_duration_ms' => 0,
                'total_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ],
        ];
    }

    private function handleDynamicIntent(string $intent, string $message, $user, array $entities): array
    {
        return match ($intent) {
            'product_search' => $this->handleProductSearchIntent($message, $user, $entities),
            'product_price' => $this->handleProductInfoIntent($message, $user, 'get_product_price', 'product_price', $entities),
            'product_stock' => $this->handleProductInfoIntent($message, $user, 'get_product_stock', 'product_stock', $entities),
            'product_variant' => $this->handleProductInfoIntent($message, $user, 'get_product_variants', 'product_variant', $entities),
            'order_query' => $this->handleOrderIntent($message, $user),
            'promotion_query' => $this->handlePromotionIntentV2($message, $user),
            default => $this->dynamicEmptyResponse('rag', [], 'Hiện tại tôi chưa tìm thấy thông tin này trong hệ thống. Bạn vui lòng liên hệ bộ phận hỗ trợ của CTUT UniShop để được xác nhận.'),
        };
    }

    private function handleProductSearchIntent(string $message, $user, array $entities): array
    {
        if ($this->shouldClarifyProductQuestion($entities)) {
            return $this->clarifyResponse($entities);
        }

        $query = trim((string) ($entities['product_query'] ?? ''));
        $fallbackQuery = trim(implode(' ', array_filter([
            $entities['category_query'] ?? null,
            $entities['department_query'] ?? null,
        ])));

        $toolName = 'search_products';
        $arguments = array_filter([
            'query' => $query !== '' ? $query : $fallbackQuery,
            'limit' => 5,
            'category_query' => $entities['category_query'] ?? null,
            'department_query' => $entities['department_query'] ?? null,
            'size' => $entities['size'] ?? null,
            'color' => $entities['color'] ?? null,
            'price_min' => $entities['price_min'] ?? null,
            'price_max' => $entities['price_max'] ?? null,
            'in_stock_only' => false,
        ], fn ($value) => $value !== null && $value !== '');

        $result = $this->productToolService->execute($toolName, $arguments, $user);
        $toolCalls = [[
            'name' => $toolName,
            'arguments' => $arguments,
            'result' => $result,
            'summary' => $this->summarizeToolResult($toolName, $result),
        ]];

        $products = $this->extractProductsFromToolCalls($toolCalls);

        if (empty($products)) {
            return $this->dynamicEmptyResponse('product_search', $toolCalls, 'Mình chưa tìm thấy sản phẩm phù hợp trong hệ thống.');
        }

        $topScores = collect($products)->pluck('search_score')->filter()->values();
        if ($topScores->count() >= 3 && $topScores[0] === $topScores[1] && $topScores[1] === $topScores[2]) {
            $choices = collect($products)
                ->take(3)
                ->map(fn ($product, int $index) => ($index + 1) . '. ' . ($product['name'] ?? 'Sản phẩm'))
                ->implode("\n");

            return $this->dynamicSuccessResponse(
                'clarify',
                "Mình tìm thấy một vài sản phẩm gần giống. Bạn muốn hỏi sản phẩm nào?\n{$choices}",
                $toolCalls,
                $products
            );
        }

        return $this->dynamicSuccessResponse(
            'product_search',
            'Mình tìm thấy ' . count($products) . ' sản phẩm phù hợp trong hệ thống.',
            $toolCalls,
            $products
        );
    }

    private function handleProductInfoIntent(string $message, $user, string $toolName, string $intent, array $entities): array
    {
        $productName = trim((string) ($entities['product_query'] ?? ''));

        if ($this->shouldClarifyProductQuestion($entities) || $productName === '') {
            return $this->clarifyResponse($entities);
        }

        $arguments = match ($toolName) {
            'get_product_price', 'get_product_stock' => [
                'product_id' => null,
                'product_name' => $productName,
                'size' => $entities['size'] ?? null,
                'color' => $entities['color'] ?? null,
            ],
            default => [
                'product_id' => null,
                'product_name' => $productName,
            ],
        };

        $result = $this->productToolService->execute($toolName, $arguments, $user);
        $toolCalls = [[
            'name' => $toolName,
            'arguments' => $arguments,
            'result' => $result,
            'summary' => $this->summarizeToolResult($toolName, $result),
        ]];
        $products = $this->extractProductsFromToolCalls($toolCalls);

        if (empty($result['found'])) {
            $fallback = $this->fallbackProductInfoBySearch($toolName, $intent, $productName, $entities, $user, $toolCalls);

            if ($fallback !== null) {
                return $fallback;
            }

            return $this->dynamicEmptyResponse($intent, $toolCalls, 'Mình chưa tìm thấy sản phẩm phù hợp trong hệ thống.');
        }

        $answer = match ($intent) {
            'product_price' => $this->buildProductPriceAnswer($result),
            'product_stock' => $this->buildProductStockAnswer($result),
            default => $this->buildProductVariantAnswer($result),
        };

        return $this->dynamicSuccessResponse($intent, $answer, $toolCalls, $products);
    }

    private function handleOrderIntent(string $message, $user): array
    {
        if (!$user) {
            return $this->dynamicEmptyResponse('order_query', [], 'Không tìm thấy đơn hàng');
        }

        $orderCode = $this->extractOrderCode($message);
        $query = Order::query()
            ->with(['payments:id,order_id,method,status,amount', 'items:id,order_id,quantity'])
            ->where('user_id', $user->id)
            ->latest();

        if ($orderCode) {
            $query->where('order_code', $orderCode);
        }

        $orders = $query->limit($orderCode ? 1 : 3)->get();

        if ($orders->isEmpty()) {
            return $this->dynamicEmptyResponse('order_query', [], 'Không tìm thấy đơn hàng');
        }

        $lines = $orders->map(function ($order) {
            $payment = $order->payments->first();
            $total = number_format((float) ($order->grand_total ?? $order->total ?? 0), 0, ',', '.') . ' đ';

            return "{$order->order_code}: trạng thái {$order->status}, thanh toán " . ($payment?->status ?? 'pending') . ", tổng {$total}.";
        })->implode("\n");

        return [
            'response_id' => null,
            'answer' => "Mình đã tra cứu đơn hàng trong hệ thống:\n{$lines}",
            'intent' => 'order_query',
            'sources' => [],
            'tool_calls' => [],
            'products' => [],
            'promotions' => [],
        ];
    }

    private function fallbackProductInfoBySearch(string $toolName, string $intent, string $productName, array $entities, $user, array $toolCalls): ?array
    {
        if (!in_array($toolName, ['get_product_price', 'get_product_stock'], true)) {
            return null;
        }

        $searchArguments = array_filter([
            'query' => $productName,
            'limit' => 5,
            'category_query' => $entities['category_query'] ?? null,
            'department_query' => $entities['department_query'] ?? null,
            'size' => $entities['size'] ?? null,
            'color' => $entities['color'] ?? null,
            'in_stock_only' => $intent === 'product_stock',
        ], fn ($value) => $value !== null && $value !== '');

        $searchResult = $this->productToolService->execute('search_products', $searchArguments, $user);
        $toolCalls[] = [
            'name' => 'search_products',
            'arguments' => $searchArguments,
            'result' => $searchResult,
            'summary' => $this->summarizeToolResult('search_products', $searchResult),
        ];

        $products = $this->extractProductsFromToolCalls([end($toolCalls)]);

        if (empty($products)) {
            return null;
        }

        if (count($products) > 1) {
            $choices = collect($products)
                ->take(3)
                ->map(fn ($product, int $index) => ($index + 1) . '. ' . ($product['name'] ?? 'Sản phẩm'))
                ->implode("\n");

            return $this->dynamicSuccessResponse(
                'clarify',
                "Mình tìm thấy một vài sản phẩm gần giống. Bạn muốn hỏi " . ($intent === 'product_price' ? 'giá' : 'tồn kho') . " sản phẩm nào?\n{$choices}",
                $toolCalls,
                $products
            );
        }

        $matchedProductName = (string) ($products[0]['name'] ?? '');

        if ($matchedProductName === '') {
            return null;
        }

        $arguments = [
            'product_name' => $matchedProductName,
            'size' => $entities['size'] ?? null,
            'color' => $entities['color'] ?? null,
        ];
        $result = $this->productToolService->execute($toolName, $arguments, $user);
        $toolCalls[] = [
            'name' => $toolName,
            'arguments' => $arguments,
            'result' => $result,
            'summary' => $this->summarizeToolResult($toolName, $result),
        ];

        if (empty($result['found'])) {
            return $this->dynamicEmptyResponse($intent, $toolCalls, 'Mình chưa tìm thấy sản phẩm phù hợp trong hệ thống.');
        }

        $answer = $intent === 'product_price'
            ? $this->buildProductPriceAnswer($result)
            : $this->buildProductStockAnswer($result);

        return $this->dynamicSuccessResponse($intent, $answer, $toolCalls, $this->extractProductsFromToolCalls($toolCalls));
    }

    private function handlePromotionIntent(string $message, $user): array
    {
        $promotionQuery = $this->extractPromotionQuery($message);
        $toolCalls = [];

        if ($this->isPromotionProductQuestion($message)) {
        $result = $this->productToolService->execute('get_promotion_products', [
            'promotion_id' => null,
            'query' => $promotionQuery,
            'limit' => 12,
        ], $user);

            $toolCalls[] = [
                'name' => 'get_promotion_products',
                'arguments' => [
                    'promotion_id' => null,
                    'query' => $promotionQuery,
                    'limit' => 12,
                ],
                'result' => $result,
                'summary' => $this->summarizeToolResult('get_promotion_products', $result),
            ];

            $products = $this->extractProductsFromToolCalls($toolCalls);
            $promotions = $this->extractPromotionsFromToolCalls($toolCalls);

            if (empty($products)) {
                return $this->dynamicEmptyResponse('promotion_query', $toolCalls, 'Hiện chưa có chương trình khuyến mãi phù hợp');
            }

            $promotionTitle = data_get($result, 'promotion.title', 'chương trình khuyến mãi đang diễn ra');

            return [
                'response_id' => null,
                'answer' => 'Mình đã tìm thấy sản phẩm trong ' . $promotionTitle . '.',
                'intent' => 'promotion_query',
                'sources' => [],
                'tool_calls' => $toolCalls,
                'products' => $products,
                'promotions' => $promotions,
            ];
        }

        $toolName = $promotionQuery !== '' ? 'search_promotions' : 'get_active_promotions';
        $arguments = $promotionQuery !== ''
            ? ['query' => $promotionQuery, 'limit' => 5]
            : ['limit' => 5];

        $result = $this->productToolService->execute($toolName, $arguments, $user);
        $toolCalls[] = [
            'name' => $toolName,
            'arguments' => $arguments,
            'result' => $result,
            'summary' => $this->summarizeToolResult($toolName, $result),
        ];

        $promotions = $this->extractPromotionsFromToolCalls($toolCalls);

        if (empty($promotions)) {
            return $this->dynamicEmptyResponse('promotion_query', $toolCalls, 'Hiện chưa có chương trình khuyến mãi phù hợp');
        }

        $lines = collect($promotions)
            ->take(5)
            ->map(function ($promotion, int $index) {
                $parts = collect([
                    $this->formatDiscountText($promotion['discount_type'] ?? null, $promotion['discount_value'] ?? null),
                    $this->formatPromotionTime($promotion),
                    !empty($promotion['min_order_value']) ? 'Điều kiện từ ' . number_format((float) $promotion['min_order_value'], 0, ',', '.') . ' đ' : null,
                ])->filter()->implode(', ');

                return ($index + 1) . '. ' . ($promotion['title'] ?? 'Khuyến mãi') . ($parts !== '' ? ' (' . $parts . ')' : '');
            })
            ->implode("\n");

        return [
            'response_id' => null,
            'answer' => "Hiện CTUT UniShop đang có các chương trình khuyến mãi:\n{$lines}",
            'intent' => 'promotion_query',
            'sources' => [],
            'tool_calls' => $toolCalls,
            'products' => [],
            'promotions' => $promotions,
        ];
    }

    private function createResponse(array $payload): array
    {
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            throw new RuntimeException('Chưa cấu hình OPENAI_API_KEY', 500);
        }

        $baseUrl = rtrim(config('services.openai.base_url'), '/');

        try {
            return Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(30)
                ->post($baseUrl . '/responses', $payload)
                ->throw()
                ->json();
        } catch (Throwable $e) {
            throw new RuntimeException('Không thể kết nối OpenAI API: ' . $e->getMessage(), 500);
        }
    }

    private function buildInput(ChatConversation $conversation): array
    {
        $limit = (int) config('services.openai.chat_max_history', 12);
        $limit = max(6, min($limit, 12));

        $conversation->loadMissing('summary');
        $messages = $this->sessionService->recentMessages($conversation, $limit);
        $input = [];

        $summary = trim((string) $conversation->summary?->summary);

        if ($summary !== '') {
            $input[] = [
                'role' => 'system',
                'content' => 'Tóm tắt ngữ cảnh hội thoại trước đó: ' . $summary,
            ];
        }

        $messageInput = $messages
            ->map(fn ($message) => [
                'role' => $message->role,
                'content' => $message->content,
            ])
            ->values()
            ->toArray();

        return array_merge($input, $messageInput);
    }

    private function tools(): array
    {
        $vectorStoreId = config('services.openai.vector_store_id');

        if (!$vectorStoreId) {
            return [];
        }

        return [[
            'type' => 'file_search',
            'vector_store_ids' => [$vectorStoreId],
            'max_num_results' => 3,
        ]];
    }

    private function detectIntent(string $message): string
    {
        return $this->extractEntities($message)['intent'];
    }

    private function extractEntities(string $message): array
    {
        $text = $this->normalizeVietnameseText($message);
        $size = $this->extractSize($text);
        $color = $this->extractColor($text);
        $priceRange = $this->extractPriceRange($text);
        $categoryQuery = $this->extractCategoryQuery($text);
        $departmentQuery = $this->extractDepartmentQuery($text);
        $smallTalkType = $this->detectSmallTalkType($text);
        $isOffTopic = $this->isOffTopicRequest($text);

        $hasPromotionSignal = $this->containsAny($text, [
            'khuyen mai', 'giam gia', 'voucher', 'deal', 'sale', 'uu dai',
        ]);
        $hasOrderSignal = $this->containsAny($text, [
            'don hang', 'ma don', 'order', 'ord-', 'trang thai don',
        ]);
        $hasStaticKnowledgeSignal = $this->containsAny($text, [
            'chinh sach', 'faq', 'cau hoi thuong gap', 'huong dan', 'huong dan mua hang',
            'cach mua', 'cach dat hang', 'mua hang', 'dat hang', 'doi tra', 'hoan tien', 'hoan tra', 'bao hanh',
            'thanh toan', 'thanh toan khi nhan hang', 'cod', 'giao hang', 'giao nhan', 'van chuyen', 'nhan hang',
            'lien he', 'ho tro', 'gioi thieu', 'ctut unishop', 'CTUT UniShop',
            'cua hang la gi', 'quy dinh',
        ]);
        $hasPriceSignal = $this->containsAny($text, [
            'gia', 'bao nhieu', 'may tien', 'gia nhieu', 'nhieu tien', 'duoi', 'tren',
        ]) || $priceRange['min'] !== null || $priceRange['max'] !== null;
        $hasStockSignal = $this->containsAny($text, [
            'con hang', 'het hang', 'ton kho', 'stock', 'con khong', 'co san', 'san hang',
            'con size', 'con mau', 'con may cai', 'so luong', 'con bao nhieu',
        ]);
        $hasVariantSignal = $this->containsAny($text, [
            'size', 'mau', 'color', 'kich thuoc', 'bien the', 'phan loai',
            'mau nao', 'mau gi', 'may mau', 'co nao', 'form', 'loai',
        ]) || $size !== null || $color !== null;
        $hasCatalogSignal = $this->containsAny($text, $this->catalogSignalWords())
            || $categoryQuery !== null
            || $departmentQuery !== null;

        $productQuery = $this->cleanProductQuery($text, $categoryQuery, $departmentQuery, $size, $color);
        $hasSpecificProduct = $productQuery !== '' || $categoryQuery !== null || $departmentQuery !== null;
        $isAmbiguous = $this->isAmbiguousProductQuestion($text, $productQuery, $hasCatalogSignal, $hasPriceSignal, $hasStockSignal, $hasVariantSignal);

        if ($smallTalkType !== null) {
            $intent = 'small_talk';
            $confidence = 0.95;
        } elseif ($hasOrderSignal) {
            $intent = 'order_query';
            $confidence = 0.9;
        } elseif ($hasPromotionSignal) {
            $intent = 'promotion_query';
            $confidence = 0.88;
        } elseif ($isOffTopic) {
            $intent = 'off_topic';
            $confidence = 0.92;
        } elseif ($hasStaticKnowledgeSignal) {
            $intent = 'static_knowledge';
            $confidence = 0.85;
        } elseif ($isAmbiguous) {
            $intent = 'clarify';
            $confidence = 0.3;
        } elseif ($hasPriceSignal && $hasSpecificProduct) {
            $intent = 'product_price';
            $confidence = 0.82;
        } elseif ($hasStockSignal && $hasSpecificProduct && $productQuery !== '') {
            $intent = 'product_stock';
            $confidence = 0.82;
        } elseif ($hasStockSignal && !$hasSpecificProduct) {
            $intent = 'clarify';
            $confidence = 0.3;
        } elseif ($hasVariantSignal && $hasSpecificProduct && $productQuery !== '') {
            $intent = 'product_variant';
            $confidence = 0.8;
        } elseif ($hasCatalogSignal) {
            $intent = 'product_search';
            $confidence = 0.72;
        } elseif ($productQuery !== '' && $this->looksLikePotentialProductQuery($productQuery)) {
            $intent = 'product_search';
            $confidence = 0.55;
        } else {
            $intent = 'rag';
            $confidence = 0.65;
        }

        $entities = [
            'intent' => $intent,
            'original_message' => $message,
            'normalized_message' => $text,
            'product_query' => $productQuery,
            'category_query' => $categoryQuery,
            'department_query' => $departmentQuery,
            'size' => $size,
            'color' => $color,
            'price_min' => $priceRange['min'],
            'price_max' => $priceRange['max'],
            'confidence' => $confidence,
            'small_talk_type' => $smallTalkType,
            'is_off_topic' => $isOffTopic,
            'has_static_knowledge_signal' => $hasStaticKnowledgeSignal,
            'has_dynamic_signal' => $hasCatalogSignal || $hasPriceSignal || $hasStockSignal || $hasVariantSignal || $hasPromotionSignal || $hasOrderSignal,
            'classification_source' => 'rule',
            'rule_intent' => $intent,
        ];

        return $this->refineEntitiesWithGpt($message, $entities);
    }

    private function refineEntitiesWithGpt(string $message, array $ruleEntities): array
    {
        if (!$this->shouldUseGptIntentClassifier($message, $ruleEntities)) {
            return $ruleEntities;
        }

        $gptEntities = $this->classifyIntentWithGpt($message, $ruleEntities);

        if ($gptEntities === null) {
            return $ruleEntities;
        }

        $merged = array_merge($ruleEntities, array_filter([
            'intent' => $gptEntities['intent'] ?? null,
            'product_query' => $gptEntities['product_query'] ?? null,
            'category_query' => $gptEntities['category_query'] ?? null,
            'department_query' => $gptEntities['department_query'] ?? null,
            'size' => $gptEntities['size'] ?? null,
            'color' => $gptEntities['color'] ?? null,
            'price_min' => $gptEntities['price_min'] ?? null,
            'price_max' => $gptEntities['price_max'] ?? null,
        ], fn ($value) => $value !== null && $value !== ''));

        $merged['confidence'] = max(
            (float) ($ruleEntities['confidence'] ?? 0),
            min(0.99, (float) ($gptEntities['confidence'] ?? 0))
        );
        $merged['classification_source'] = 'gpt_fallback';
        $merged['gpt_intent'] = $gptEntities['intent'] ?? null;
        $merged['gpt_confidence'] = $gptEntities['confidence'] ?? null;

        if (
            in_array($merged['intent'] ?? null, ['rag', 'static_knowledge'], true)
            && !empty($ruleEntities['has_dynamic_signal'])
        ) {
            $merged['intent'] = $ruleEntities['intent'] === 'rag' ? 'clarify' : $ruleEntities['intent'];
        }

        if (
            in_array($merged['intent'] ?? null, ['product_price', 'product_stock', 'product_variant'], true)
            && trim((string) ($merged['product_query'] ?? '')) === ''
        ) {
            $merged['intent'] = 'clarify';
        }

        if (
            in_array($merged['intent'] ?? null, ['product_price', 'product_stock', 'product_variant'], true)
            && (
                !empty($ruleEntities['category_query'])
                || !empty($ruleEntities['department_query'])
                || $this->isGenericProductSuggestionQuery((string) ($ruleEntities['original_message'] ?? $message))
            )
        ) {
            $merged['intent'] = 'product_search';
            $merged['product_query'] = trim((string) ($ruleEntities['product_query'] ?? $merged['product_query'] ?? ''));
            $merged['category_query'] = $ruleEntities['category_query'] ?? ($merged['category_query'] ?? null);
            $merged['department_query'] = $ruleEntities['department_query'] ?? ($merged['department_query'] ?? null);
        }

        return $merged;
    }

    private function shouldUseGptIntentClassifier(string $message, array $ruleEntities): bool
    {
        if (!config('services.openai.intent_classifier_enabled', true)) {
            return false;
        }

        if (mb_strlen(trim($message)) < 5) {
            return false;
        }

        $intent = $ruleEntities['intent'] ?? 'unknown';
        $confidence = (float) ($ruleEntities['confidence'] ?? 0);

        if (in_array($intent, ['small_talk', 'off_topic'], true) && $confidence >= 0.9) {
            return false;
        }

        if (in_array($intent, ['order_query', 'promotion_query'], true) && $confidence >= 0.88) {
            return false;
        }

        if ($intent === 'static_knowledge' && $confidence >= 0.9) {
            return false;
        }

        return $confidence < (float) config('services.openai.intent_classifier_threshold', 0.78)
            || in_array($intent, ['clarify', 'rag'], true);
    }

    private function classifyIntentWithGpt(string $message, array $ruleEntities): ?array
    {
        try {
            $response = $this->createResponse([
                'model' => config('services.openai.chat_model'),
                'instructions' => $this->intentClassifierPrompt(),
                'input' => [[
                    'role' => 'user',
                    'content' => json_encode([
                        'message' => $message,
                        'rule_intent' => $ruleEntities['intent'] ?? 'unknown',
                        'rule_confidence' => $ruleEntities['confidence'] ?? 0,
                        'rule_product_query' => $ruleEntities['product_query'] ?? '',
                        'rule_category_query' => $ruleEntities['category_query'] ?? null,
                        'rule_department_query' => $ruleEntities['department_query'] ?? null,
                        'rule_size' => $ruleEntities['size'] ?? null,
                        'rule_color' => $ruleEntities['color'] ?? null,
                        'rule_price_min' => $ruleEntities['price_min'] ?? null,
                        'rule_price_max' => $ruleEntities['price_max'] ?? null,
                    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ]],
                'max_output_tokens' => 250,
            ]);

            $payload = $this->parseIntentClassifierPayload($this->extractAnswer($response));
            $intent = $payload['intent'] ?? null;

            if (!is_string($intent) || !in_array($intent, self::GPT_INTENT_ALLOWLIST, true)) {
                return null;
            }

            return [
                'intent' => $intent,
                'product_query' => trim((string) ($payload['product_query'] ?? '')) ?: null,
                'category_query' => $this->normalizeNullableString($payload['category_query'] ?? null),
                'department_query' => $this->normalizeNullableString($payload['department_query'] ?? null),
                'size' => $this->normalizeNullableString($payload['size'] ?? null),
                'color' => $this->normalizeNullableString($payload['color'] ?? null),
                'price_min' => is_numeric($payload['price_min'] ?? null) ? (float) $payload['price_min'] : null,
                'price_max' => is_numeric($payload['price_max'] ?? null) ? (float) $payload['price_max'] : null,
                'confidence' => is_numeric($payload['confidence'] ?? null) ? (float) $payload['confidence'] : 0.7,
            ];
        } catch (Throwable) {
            return null;
        }
    }

    private function parseIntentClassifierPayload(string $answer): ?array
    {
        $answer = trim($answer);

        if ($answer === '') {
            return null;
        }

        $decoded = json_decode($answer, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        if (preg_match('/\{.*\}/s', $answer, $matches) !== 1) {
            return null;
        }

        try {
            $decoded = json_decode($matches[0], true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }

    private function shouldClarifyProductQuestion(array $entities): bool
    {
        $intent = $entities['intent'] ?? null;

        return $intent === 'clarify'
            || (in_array($intent, ['product_price', 'product_stock', 'product_variant'], true)
                && trim((string) ($entities['product_query'] ?? '')) === '');
    }

    private function clarifyResponse(array $entities): array
    {
        return $this->dynamicEmptyResponse(
            'clarify',
            [],
            'Mình chưa rõ bạn muốn hỏi sản phẩm nào. Bạn có thể nhập rõ hơn tên sản phẩm, ví dụ: áo thun, hoodie, túi tote, móc khóa hoặc bảng tên.'
        );
    }

    private function smallTalkResponse(array $entities): array
    {
        $type = $entities['small_talk_type'] ?? 'greeting';
        $answer = in_array($type, ['thanks', 'goodbye'], true)
            ? 'Rất vui được hỗ trợ bạn. Nếu cần thêm thông tin về CTUT UniShop, bạn cứ nhắn cho mình nhé.'
            : 'Chào bạn, mình là trợ lý CTUT UniShop. Bạn cần mình hỗ trợ về sản phẩm, đơn hàng, khuyến mãi hay hướng dẫn mua hàng?';

        return [
            'response_id' => null,
            'answer' => $answer,
            'intent' => 'small_talk',
            'sources' => [],
            'tool_calls' => [],
            'products' => [],
            'promotions' => [],
        ];
    }

    private function offTopicResponse(array $entities): array
    {
        return [
            'response_id' => null,
            'answer' => 'CTUT UniShop hiện chưa hỗ trợ sản phẩm này. Bạn có thể hỏi mình về các sản phẩm CTUT như áo thun, hoodie, túi tote, móc khóa, bảng tên hoặc chính sách mua hàng.',
            'intent' => 'off_topic',
            'sources' => [],
            'tool_calls' => [],
            'products' => [],
            'promotions' => [],
        ];
    }

    private function detectSmallTalkType(string $text): ?string
    {
        $text = trim($text);

        if ($text === '') {
            return null;
        }

        if (in_array($text, ['xin chao', 'chao', 'chao shop', 'hello', 'hi'], true)) {
            return 'greeting';
        }

        if (in_array($text, ['cam on', 'cam on shop', 'thanks', 'thank you', 'ok', 'duoc roi'], true)) {
            return 'thanks';
        }

        if (in_array($text, ['tam biet', 'bye', 'goodbye'], true)) {
            return 'goodbye';
        }

        return null;
    }

    private function looksLikePotentialProductQuery(string $query): bool
    {
        $query = trim($query);

        if ($query === '' || mb_strlen($query) < 4) {
            return false;
        }

        return $this->containsAny($query, $this->catalogSignalWords());
    }

    private function isOffTopicRequest(string $text): bool
    {
        return $this->containsAny($text, [
            'pho',
            'com',
            'bun',
            'mi',
            'tra sua',
            'ca phe',
            'nuoc mia',
            'banh mi',
            'do an',
            'mon an',
            'thuc an',
        ]);
    }

    private function isAmbiguousProductQuestion(
        string $text,
        string $productQuery,
        bool $hasCatalogSignal,
        bool $hasPriceSignal,
        bool $hasStockSignal,
        bool $hasVariantSignal
    ): bool {
        $ambiguousPhrases = [
            'co khong',
            'bao nhieu',
            'con khong',
            'con hang khong',
            'cai nay con hang khong',
            'cai nay bao nhieu',
            'co ban pho khong',
        ];

        foreach ($ambiguousPhrases as $phrase) {
            if ($text === $phrase || str_contains($text, $phrase)) {
                if ($productQuery === '' || mb_strlen($productQuery) <= 3) {
                    return true;
                }
            }
        }

        if (($hasPriceSignal || $hasStockSignal || $hasVariantSignal) && $productQuery === '' && !$hasCatalogSignal) {
            return true;
        }

        return false;
    }

    private function cleanProductQuery(string $text, ?string $categoryQuery, ?string $departmentQuery, ?string $size, ?string $color): string
    {
        $query = ' ' . $text . ' ';
        $query = preg_replace('/\b(shop oi|cho minh|giup minh|tu van|toi muon hoi|xin hoi|tim|kiem|xem|hoi|mua|lam)\b/u', ' ', $query);
        $query = preg_replace('/\b(gia|bao nhieu|may tien|gia nhieu|nhieu tien|price|con hang|het hang|ton kho|stock|con khong|co san|san hang|con size|con mau|so luong|con bao nhieu)\b/u', ' ', $query);
        $query = preg_replace('/\b(size|mau|color|kich thuoc|bien the|phan loai|mau nao|mau gi|may mau|form|loai nao)\b/u', ' ', $query);
        $query = preg_replace('/\b(duoi|tren|tu|den|nho hon|lon hon|toi da|khong qua)\s+\d+(?:[.,]\d+)?\s*(k|nghin|ngan|trieu|m|vnd|d|dong)?\b/u', ' ', $query);

        foreach (array_filter([$departmentQuery, $size, $color]) as $remove) {
            $query = str_replace(' ' . $remove . ' ', ' ', $query);
        }

        $tokens = preg_split('/\s+/', trim($query)) ?: [];
        $tokens = array_values(array_filter($tokens, fn ($token) => $token !== '' && !in_array($token, [
            'co', 'khong', 'nao', 'gi', 'cai', 'nay', 'minh', 'toi', 'em', 'anh', 'chi', 'khoa',
            'ban', 'store', 'shop', 'san', 'pham', 'hang',
        ], true)));

        $query = trim(implode(' ', $tokens));

        if ($query === '' && $categoryQuery !== null) {
            return $categoryQuery;
        }

        return $query;
    }

    private function extractCategoryQuery(string $text): ?string
    {
        $categories = [
            'dong phuc' => ['dong phuc', 'ao dong phuc'],
            'phu kien' => ['phu kien'],
            'hoc tap' => ['hoc tap'],
            'qua tang' => ['qua tang', 'luu niem'],
        ];

        foreach ($categories as $category => $phrases) {
            if ($this->containsAny($text, $phrases)) {
                return $category;
            }
        }

        return null;
    }

    private function extractDepartmentQuery(string $text): ?string
    {
        $departments = [
            'cong nghe thong tin' => ['cong nghe thong tin', 'cntt', 'khoa cntt'],
            'co khi' => ['co khi', 'khoa co khi'],
            'dien' => ['dien', 'dien tu', 'vien thong', 'dien tu vien thong'],
            'xay dung' => ['xay dung', 'khoa xay dung'],
            'quan ly cong nghiep' => ['quan ly cong nghiep', 'qlcn'],
            'khoa hoc co ban' => ['khoa hoc co ban'],
        ];

        foreach ($departments as $department => $phrases) {
            if ($this->containsAny($text, $phrases)) {
                return $department;
            }
        }

        return null;
    }

    private function extractSize(string $text): ?string
    {
        if (preg_match('/(?:\b(?:size|co|cỡ)\s*)\b(xs|s|m|l|xl|xxl|xxxl)\b|\b(xs|s|m|l|xl|xxl|xxxl)\b/iu', $text, $matches)) {
            $size = $matches[1] ?: $matches[2] ?: null;

            if ($size === null) {
                return null;
            }

            $standaloneToken = mb_strtolower($size);
            if (in_array($standaloneToken, ['s', 'm', 'l'], true)) {
                $normalizedText = ' ' . preg_replace('/\s+/', ' ', trim($text)) . ' ';

                if (!preg_match('/\b(size|co|cỡ)\s*' . preg_quote($standaloneToken, '/') . '\b/iu', $normalizedText)) {
                    return null;
                }
            }

            return mb_strtoupper($size);
        }

        return null;
    }

    private function extractColor(string $text): ?string
    {
        foreach (['xanh navy', 'navy', 'xanh', 'do', 'den', 'trang', 'vang', 'tim', 'hong', 'xam', 'nau', 'cam'] as $color) {
            if ($color === 'tim') {
                if (preg_match('/\b(mau|color)\s+tim\b|\btim\s+(mau|ao|quan|hoodie|tui|non)\b/u', $text)) {
                    return $color;
                }

                continue;
            }

            if (preg_match('/\b' . preg_quote($color, '/') . '\b/u', $text)) {
                return $color;
            }
        }

        return null;
    }

    private function extractPriceRange(string $text): array
    {
        $range = ['min' => null, 'max' => null];

        if (preg_match('/\b(duoi|nho hon|toi da|khong qua)\s+(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|trieu|m|vnd|d|dong)?\b/u', $text, $matches)) {
            $range['max'] = $this->normalizeMoneyValue($matches[2], $matches[3] ?? null);
        }

        if (preg_match('/\b(tren|lon hon|tu)\s+(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|trieu|m|vnd|d|dong)?\b/u', $text, $matches)) {
            $range['min'] = $this->normalizeMoneyValue($matches[2], $matches[3] ?? null);
        }

        return $range;
    }

    private function normalizeMoneyValue(string $value, ?string $unit): float
    {
        $amount = (float) str_replace(',', '.', $value);
        $unit = trim((string) $unit);

        if (in_array($unit, ['k', 'nghin', 'ngan'], true)) {
            return $amount * 1000;
        }

        if (in_array($unit, ['trieu', 'm'], true)) {
            return $amount * 1000000;
        }

        if ($amount > 0 && $amount < 1000 && $unit === '') {
            return $amount * 1000;
        }

        return $amount;
    }

    private function catalogSignalWords(): array
    {
        return [
            'san pham', 'ao', 'ao thun', 'hoodie', 'dong phuc', 'phu kien', 'hoc tap',
            'qua tang', 'luu niem', 'binh nuoc', 'ly', 'mu', 'non', 'cap', 'sach', 'vo',
            'but', 'bang ten', 'day deo the', 'tui tote', 'moc khoa', 'balo',
            'co khi', 'dien', 'dien tu', 'vien thong', 'cong nghe thong tin', 'cntt',
            'xay dung', 'quan ly cong nghiep', 'khoa hoc co ban',
        ];
    }

    private function containsAny(string $text, array $needles): bool
    {
        foreach ($needles as $needle) {
            if ($needle !== '' && str_contains($text, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function normalizeChatText(string $message): string
    {
        return $this->normalizeVietnameseText($message);
    }

    private function normalizeVietnameseText(string $message): string
    {
        $text = Str::ascii(mb_strtolower(trim($message)));
        $text = preg_replace('/[^\pL\pN\s]/u', ' ', $text);
        $text = preg_replace('/\s+/', ' ', $text);

        return trim((string) $text);
    }

    private function summarizeToolResult(string $name, array $result): array
    {
        $products = [];

        if (!empty($result['product']) && is_array($result['product'])) {
            $products = [$result['product']];
        }

        if (!empty($result['products']) && is_array($result['products'])) {
            $products = $result['products'];
        }

        return [
            'name' => $name,
            'found' => (bool) ($result['found'] ?? !empty($products)),
            'product_count' => count($products),
            'promotion_count' => count($result['promotions'] ?? []) + (!empty($result['promotion']) ? 1 : 0),
            'message' => $result['message'] ?? null,
            'type' => $result['type'] ?? null,
            'query' => $result['query'] ?? null,
            'keywords' => $result['keywords'] ?? [],
        ];
    }

    private function sanitizeAnswer(string $answer): string
    {
        $answer = trim($answer);

        if ($answer === '') {
            return '';
        }

        $answer = preg_replace('/\[(.*?)\]\((https?:\/\/[^\s]+)\)/u', '$1: $2', $answer);
        $answer = preg_replace('/[*_`#>~]+/u', '', $answer);
        $answer = preg_replace('/[ \t]+\n/u', "\n", $answer);
        $answer = preg_replace('/\n{3,}/u', "\n\n", $answer);

        return trim($answer);
    }

    private function extractProductsFromToolCalls(array $toolCalls): array
    {
        return collect($toolCalls)
            ->flatMap(function ($toolCall) {
                $result = $toolCall['result'] ?? [];

                if (!empty($result['product'])) {
                    return [$result['product']];
                }

                if (!empty($result['products']) && is_array($result['products'])) {
                    return $result['products'];
                }

                return [];
            })
            ->filter(fn ($product) => !empty($product['id']))
            ->unique('id')
            ->take(6)
            ->values()
            ->toArray();
    }

    private function extractPromotionsFromToolCalls(array $toolCalls): array
    {
        return collect($toolCalls)
            ->flatMap(function ($toolCall) {
                $result = $toolCall['result'] ?? [];
                $promotions = [];

                if (!empty($result['promotion']) && is_array($result['promotion'])) {
                    $promotions[] = $result['promotion'];
                }

                if (!empty($result['promotions']) && is_array($result['promotions'])) {
                    $promotions = array_merge($promotions, $result['promotions']);
                }

                if (!empty($result['products']) && is_array($result['products'])) {
                    foreach ($result['products'] as $product) {
                        if (!empty($product['promotion']) && is_array($product['promotion'])) {
                            $promotions[] = $product['promotion'];
                        }
                    }
                }

                return $promotions;
            })
            ->filter(fn ($promotion) => !empty($promotion['id']) || !empty($promotion['title']))
            ->unique(fn ($promotion) => ($promotion['id'] ?? '') . '|' . ($promotion['title'] ?? ''))
            ->values()
            ->toArray();
    }

    private function handlePromotionIntentV2(string $message, $user): array
    {
        $promotionQuery = $this->extractPromotionQuery($message);
        $toolCalls = [];

        if ($this->isPromotionProductQuestion($message)) {
            $result = $this->productToolService->execute('get_promotion_products', [
                'promotion_id' => null,
                'query' => $promotionQuery,
                'limit' => 12,
            ], $user);

            $toolCalls[] = [
                'name' => 'get_promotion_products',
                'arguments' => [
                    'promotion_id' => null,
                    'query' => $promotionQuery,
                    'limit' => 12,
                ],
                'result' => $result,
                'summary' => $this->summarizeToolResult('get_promotion_products', $result),
            ];

            $products = $this->extractProductsFromToolCalls($toolCalls);
            $promotions = $this->extractPromotionsFromToolCalls($toolCalls);

            if (empty($products)) {
                return $this->dynamicEmptyResponse('promotion_query', $toolCalls, 'Hiện chưa có sản phẩm khuyến mãi phù hợp.');
            }

            $promotionTitle = data_get($result, 'promotion.title', 'chương trình khuyến mãi đang diễn ra');
            $promotionUrl = data_get($result, 'promotion.url');
            $answer = 'Mình tìm thấy ' . count($products) . " sản phẩm trong {$promotionTitle}:\n"
                . $this->buildProductListingLines($products)
                . "\nBạn muốn xem chi tiết sản phẩm nào? Chỉ cần nhắn tên sản phẩm, mình sẽ gửi link ngay.";

            if ($promotionUrl) {
                $answer .= "\nBạn cũng có thể xem toàn bộ chương trình tại: {$promotionUrl}";
            }

            return [
                'response_id' => null,
                'answer' => $answer,
                'intent' => 'promotion_query',
                'sources' => [],
                'tool_calls' => $toolCalls,
                'products' => $products,
                'promotions' => $promotions,
            ];
        }

        return $this->handlePromotionIntent($message, $user);
    }

    private function resolveContextualFollowUp(ChatConversation $conversation, string $latestMessage, $user, array $entities): ?array
    {
        $reference = $this->contextualReferenceResolver->resolve($conversation, $latestMessage);

        if (($reference['matched'] ?? false)) {
            return $this->handleResolvedReference($reference, $latestMessage, $user, $entities);
        }

        $context = $this->getLatestAssistantContext($conversation);

        if (!$context) {
            return null;
        }

        $normalized = $this->normalizeVietnameseText($latestMessage);
        $products = $context['products'] ?? [];
        $promotions = $context['promotions'] ?? [];
        $lastIntent = data_get($context, 'metadata.intent');

        if ($lastIntent !== 'promotion_query' || empty($products)) {
            return null;
        }

        if ($this->isPromotionContinuationQuestion($normalized)) {
            $promotionTitle = data_get($promotions, '0.title')
                ?? data_get($products, '0.promotion.title')
                ?? 'chương trình khuyến mãi hiện tại';
            $promotionUrl = data_get($promotions, '0.url') ?? data_get($products, '0.promotion.url');
            $answer = "Trong {$promotionTitle} hiện có " . count($products) . " sản phẩm:\n"
                . $this->buildProductListingLines($products)
                . "\nBạn muốn xem chi tiết sản phẩm nào? Chỉ cần nhắn tên sản phẩm, mình sẽ gửi link ngay.";

            if ($promotionUrl) {
                $answer .= "\nTrang khuyến mãi: {$promotionUrl}";
            }

            return [
                'response_id' => null,
                'answer' => $answer,
                'intent' => 'promotion_query',
                'sources' => [],
                'tool_calls' => [],
                'products' => $products,
                'promotions' => $promotions,
            ];
        }

        $selectedProduct = $this->resolveReferencedProductFromContext($normalized, $products);

        if (!$selectedProduct) {
            return null;
        }

        $productUrl = $selectedProduct['product_url'] ?? $selectedProduct['url'] ?? null;
        $answer = "Đây là sản phẩm bạn đang hỏi: {$selectedProduct['name']}.";

        if ($productUrl) {
            $answer .= "\nLink xem chi tiết: {$productUrl}";
        }

        return [
            'response_id' => null,
            'answer' => $answer,
            'intent' => 'product_search',
            'sources' => [],
            'tool_calls' => [],
            'products' => [$selectedProduct],
            'promotions' => $promotions,
        ];
    }

    private function handleResolvedReference(array $reference, string $message, $user, array $entities): ?array
    {
        if (($reference['entity_type'] ?? null) === 'promotion' && $this->isPromotionProductQuestion($message)) {
            return $this->handleResolvedPromotionProducts($reference, $user);
        }

        if (($reference['entity_type'] ?? null) === 'product') {
            return $this->handleResolvedProductReference($reference, $message, $user, $entities);
        }

        return null;
    }

    private function handleResolvedPromotionProducts(array $reference, $user): array
    {
        $arguments = [
            'promotion_id' => $reference['entity_id'] ?? null,
            'query' => '',
            'limit' => 12,
        ];

        $result = $this->productToolService->execute('get_promotion_products', $arguments, $user);
        $toolCalls = [[
            'name' => 'get_promotion_products',
            'arguments' => $arguments,
            'result' => $result,
            'summary' => $this->summarizeToolResult('get_promotion_products', $result),
        ]];

        $products = $this->extractProductsFromToolCalls($toolCalls);
        $promotions = $this->extractPromotionsFromToolCalls($toolCalls);

        if (empty($products)) {
            return $this->dynamicEmptyResponse('promotion_query', $toolCalls, 'Hiện chưa có sản phẩm khuyến mãi phù hợp.');
        }

        $promotionTitle = data_get($result, 'promotion.title', $reference['entity_name'] ?? 'chương trình khuyến mãi');
        $promotionUrl = data_get($result, 'promotion.url');
        $answer = 'Mình tìm thấy ' . count($products) . " sản phẩm trong {$promotionTitle}:\n"
            . $this->buildProductListingLines($products)
            . "\nBạn muốn xem chi tiết sản phẩm nào? Chỉ cần nhắn tên sản phẩm hoặc số thứ tự, mình sẽ hỗ trợ tiếp.";

        if ($promotionUrl) {
            $answer .= "\nBạn cũng có thể xem toàn bộ chương trình tại: {$promotionUrl}";
        }

        return [
            'response_id' => null,
            'answer' => $answer,
            'intent' => 'promotion_query',
            'sources' => [],
            'tool_calls' => $toolCalls,
            'products' => $products,
            'promotions' => $promotions,
        ];
    }

    private function handleResolvedProductReference(array $reference, string $message, $user, array $entities): ?array
    {
        $normalized = $this->normalizeVietnameseText($message);
        $productId = $reference['entity_id'] ?? null;

        if (!$productId) {
            return null;
        }

        if ($this->containsAny($normalized, ['gia', 'bao nhieu', 'may tien'])) {
            return $this->handleResolvedProductToolCall(
                'get_product_price',
                'product_price',
                $productId,
                $reference,
                $user,
                $entities
            );
        }

        if ($this->containsAny($normalized, ['con hang', 'het hang', 'ton kho', 'con size', 'con mau', 'stock', 'con bao nhieu'])) {
            return $this->handleResolvedProductToolCall(
                'get_product_stock',
                'product_stock',
                $productId,
                $reference,
                $user,
                $entities
            );
        }

        if ($this->containsAny($normalized, ['size', 'mau', 'color', 'bien the', 'phan loai', 'kich thuoc'])) {
            return $this->handleResolvedProductToolCall(
                'get_product_variants',
                'product_variant',
                $productId,
                $reference,
                $user,
                $entities
            );
        }

        $productUrl = data_get($reference, 'entity.attributes.url');
        $answer = 'Đây là sản phẩm bạn đang hỏi: ' . ($reference['entity_name'] ?? 'Sản phẩm') . '.';
        if ($productUrl) {
            $answer .= "\nLink xem chi tiết: {$productUrl}";
        }

        return [
            'response_id' => null,
            'answer' => $answer,
            'intent' => 'product_search',
            'sources' => [],
            'tool_calls' => [],
            'products' => [$reference['entity']],
            'promotions' => [],
        ];
    }

    private function handleResolvedProductToolCall(
        string $toolName,
        string $intent,
        int $productId,
        array $reference,
        $user,
        array $entities
    ): array {
        $arguments = [
            'product_id' => $productId,
            'product_name' => $reference['entity_name'] ?? '',
            'size' => $entities['size'] ?? null,
            'color' => $entities['color'] ?? null,
        ];

        if ($toolName === 'get_product_variants') {
            $arguments = [
                'product_id' => $productId,
                'product_name' => $reference['entity_name'] ?? '',
            ];
        }

        $result = $this->productToolService->execute($toolName, $arguments, $user);
        $toolCalls = [[
            'name' => $toolName,
            'arguments' => $arguments,
            'result' => $result,
            'summary' => $this->summarizeToolResult($toolName, $result),
        ]];

        if (empty($result['found'])) {
            return $this->dynamicEmptyResponse($intent, $toolCalls, 'Mình chưa tìm thấy dữ liệu phù hợp của sản phẩm trong hệ thống.');
        }

        $products = $this->extractProductsFromToolCalls($toolCalls);
        $answer = match ($intent) {
            'product_price' => $this->buildProductPriceAnswer($result),
            'product_stock' => $this->buildProductStockAnswer($result),
            default => $this->buildProductVariantAnswer($result),
        };

        return $this->dynamicSuccessResponse($intent, $answer, $toolCalls, $products);
    }

    private function getLatestAssistantContext(ChatConversation $conversation): ?array
    {
        $message = $this->sessionService->recentMessages($conversation, 8)
            ->reverse()
            ->first(function ($item) {
                return $item->role === 'assistant'
                    && (!empty(data_get($item->metadata, 'products')) || !empty(data_get($item->metadata, 'promotions')));
            });

        if (!$message) {
            return null;
        }

        return [
            'metadata' => $message->metadata ?? [],
            'products' => data_get($message->metadata, 'products', []),
            'promotions' => data_get($message->metadata, 'promotions', []),
        ];
    }

    private function isPromotionContinuationQuestion(string $normalizedMessage): bool
    {
        return $this->containsAny($normalizedMessage, [
            'con san pham nao nua khong',
            'con san pham nao khong',
            'con cai nao nua khong',
            'con nua khong',
            'liet ke lai san pham',
            'co may san pham',
            'tat ca san pham khuyen mai',
        ]);
    }

    private function resolveReferencedProductFromContext(string $normalizedMessage, array $products): ?array
    {
        if (preg_match('/(?:san pham|sp|cai|thu)\s*(\d{1,2})/u', $normalizedMessage, $matches)) {
            $index = max(1, (int) $matches[1]) - 1;

            return $products[$index] ?? null;
        }

        foreach ($products as $product) {
            $name = $this->normalizeVietnameseText((string) ($product['name'] ?? ''));

            if ($name !== '' && str_contains($normalizedMessage, $name)) {
                return $product;
            }
        }

        return null;
    }

    private function buildProductListingLines(array $products): string
    {
        return collect($products)
            ->values()
            ->map(function ($product, int $index) {
                $price = $this->formatChatMoney(
                    $product['promotion_price']
                    ?? $product['final_price']
                    ?? $product['price']
                    ?? null
                );

                return ($index + 1) . '. ' . ($product['name'] ?? 'Sản phẩm')
                    . ($price ? ' - ' . $price : '');
            })
            ->implode("\n");
    }

    private function formatChatMoney(mixed $value): ?string
    {
        if (!is_numeric($value)) {
            return null;
        }

        return number_format((float) $value, 0, ',', '.') . ' đ';
    }

    private function extractAnswer(array $response): string
    {
        if (!empty($response['output_text'])) {
            return trim((string) $response['output_text']);
        }

        $text = '';

        foreach (($response['output'] ?? []) as $item) {
            if (($item['type'] ?? null) !== 'message') {
                continue;
            }

            foreach (($item['content'] ?? []) as $content) {
                if (($content['type'] ?? null) === 'output_text') {
                    $text .= "\n" . ($content['text'] ?? '');
                }
            }
        }

        return trim($text);
    }

    private function extractSources(array $response): array
    {
        $sources = [];

        foreach (($response['output'] ?? []) as $item) {
            foreach (($item['content'] ?? []) as $content) {
                foreach (($content['annotations'] ?? []) as $annotation) {
                    $sources[] = [
                        'type' => $annotation['type'] ?? null,
                        'file_id' => $annotation['file_id'] ?? null,
                        'filename' => $annotation['filename'] ?? null,
                        'quote' => $annotation['quote'] ?? null,
                    ];
                }
            }
        }

        return collect($sources)
            ->filter(fn ($source) => !empty($source['file_id']) || !empty($source['filename']))
            ->unique(fn ($source) => ($source['file_id'] ?? '') . '|' . ($source['filename'] ?? ''))
            ->values()
            ->toArray();
    }

    private function extractPromotionQuery(string $message): string
    {
        return (string) Str::of(Str::ascii(mb_strtolower(trim($message))))
            ->replace([
                'cho minh',
                'giup minh',
                'shop oi',
                'toi muon hoi',
                'xin hoi',
                'khuyen mai',
                'chuong trinh',
                'uu dai',
                'giam gia',
                'voucher',
                'deal',
                'sale',
                'san pham',
                'mat hang',
                'trong',
                'cac',
                'dot',
                'dang dien ra',
                'ap dung',
            ], ' ')
            ->replace(['?', '.', ',', ':'], ' ')
            ->squish();
    }

    private function extractProductQuery(string $message): string
    {
        return (string) Str::of(Str::ascii(mb_strtolower(trim($message))))
            ->replace([
                'shop oi',
                'cho minh',
                'giup minh',
                'tu van',
                'tim',
                'kiem',
                'san pham',
                'product',
                'gia bao nhieu',
                'bao nhieu tien',
                'con hang khong',
                'het hang chua',
                'size nao',
                'mau gi',
                'co size nao',
                'co mau nao',
                'co bien the nao',
            ], ' ')
            ->replace(['?', '.', ',', ':'], ' ')
            ->explode(' ')
            ->filter(fn ($token) => $token !== '' && !in_array((string) $token, [
                'co',
                'khong',
                'nao',
                'size',
                'mau',
                'color',
                'bien',
                'the',
                'kich',
                'thuoc',
            ], true))
            ->implode(' ');
    }

    private function isPromotionProductQuestion(string $message): bool
    {
        $normalized = Str::ascii(mb_strtolower(trim($message)));

        return str_contains($normalized, 'san pham')
            || str_contains($normalized, 'mat hang')
            || str_contains($normalized, 'ap dung');
    }

    private function extractOrderCode(string $message): ?string
    {
        if (preg_match('/ORD-\d{8}-\d+/i', $message, $matches)) {
            return strtoupper($matches[0]);
        }

        return null;
    }

    private function formatDiscountText(?string $type, mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($type === 'percent') {
            return 'Giảm ' . rtrim(rtrim(number_format((float) $value, 2, ',', '.'), '0'), ',') . '%';
        }

        if ($type === 'fixed') {
            return 'Giảm ' . number_format((float) $value, 0, ',', '.') . ' đ';
        }

        return null;
    }

    private function formatPromotionTime(array $promotion): ?string
    {
        $start = $promotion['start_date'] ?? null;
        $end = $promotion['end_date'] ?? null;

        if (!$start && !$end) {
            return null;
        }

        return trim(($start ?: 'Đang áp dụng') . ' - ' . ($end ?: 'Chưa xác định'));
    }

    private function buildProductPriceAnswer(array $result): string
    {
        $productName = data_get($result, 'product.name', 'sản phẩm');
        $variants = collect($result['variants'] ?? []);

        if ($variants->isEmpty()) {
            return "Mình chưa tìm thấy giá đang bán của {$productName} trong hệ thống.";
        }

        $lines = $variants
            ->take(5)
            ->map(function ($variant) {
                $label = collect([
                    $variant['size'] ?? null,
                    $variant['color'] ?? null,
                ])->filter()->implode(' - ');
                $original = (float) ($variant['original_price'] ?? 0);
                $final = (float) ($variant['final_price'] ?? $original);
                $promotion = $final < $original ? ' (đang giảm từ ' . $this->formatMoney($original) . ')' : '';

                return '- ' . ($label !== '' ? "{$label}: " : '') . $this->formatMoney($final) . $promotion;
            })
            ->implode("\n");

        return "Giá hiện tại của {$productName} theo dữ liệu hệ thống:\n{$lines}";
    }

    private function buildProductStockAnswer(array $result): string
    {
        $productName = data_get($result, 'product.name', 'sản phẩm');
        $variants = collect($result['variants'] ?? []);

        if ($variants->isEmpty()) {
            return "Mình chưa tìm thấy tồn kho đang bán của {$productName} trong hệ thống.";
        }

        $lines = $variants
            ->take(6)
            ->map(function ($variant) {
                $label = collect([
                    $variant['size'] ?? null,
                    $variant['color'] ?? null,
                ])->filter()->implode(' - ');
                $available = (int) ($variant['available_stock'] ?? 0);
                $status = $available > 0 ? "còn {$available}" : 'hết hàng';

                return '- ' . ($label !== '' ? "{$label}: " : '') . $status;
            })
            ->implode("\n");

        return "Tồn kho hiện tại của {$productName} theo dữ liệu hệ thống:\n{$lines}";
    }

    private function buildProductVariantAnswer(array $result): string
    {
        $productName = data_get($result, 'product.name', 'sản phẩm');
        $variants = collect($result['variants'] ?? []);

        if ($variants->isEmpty()) {
            return "Mình chưa tìm thấy biến thể đang mở bán của {$productName} trong hệ thống.";
        }

        $lines = $variants
            ->take(8)
            ->map(function ($variant) {
                $label = collect([
                    $variant['size'] ?? null,
                    $variant['color'] ?? null,
                ])->filter()->implode(' - ');
                $stock = isset($variant['available_stock']) ? ', còn ' . (int) $variant['available_stock'] : '';
                $price = isset($variant['final_price']) ? ', giá ' . $this->formatMoney((float) $variant['final_price']) : '';

                return '- ' . ($label !== '' ? $label : ($variant['sku'] ?? 'Biến thể')) . $price . $stock;
            })
            ->implode("\n");

        return "{$productName} hiện có các biến thể đang mở bán:\n{$lines}";
    }

    private function formatMoney(float $amount): string
    {
        return number_format($amount, 0, ',', '.') . ' đ';
    }

    private function dynamicSuccessResponse(string $intent, string $answer, array $toolCalls, array $products = [], array $promotions = []): array
    {
        return [
            'response_id' => null,
            'answer' => $answer,
            'intent' => $intent,
            'sources' => [],
            'tool_calls' => $toolCalls,
            'products' => $products,
            'promotions' => $promotions,
        ];
    }

    private function dynamicEmptyResponse(string $intent, array $toolCalls, string $answer): array
    {
        return [
            'response_id' => null,
            'answer' => $answer,
            'intent' => $intent,
            'sources' => [],
            'tool_calls' => $toolCalls,
            'products' => [],
            'promotions' => [],
        ];
    }

    private function systemPrompt(): string
    {
        return <<<PROMPT
Bạn là trợ lý của CTUT UniShop.

Chỉ dùng file_search cho dữ liệu tĩnh do admin upload như FAQ, chính sách, hướng dẫn mua hàng, đổi trả, thanh toán, giao nhận và giới thiệu cửa hàng.
Không dùng file_search để trả lời hoặc suy đoán dữ liệu động: sản phẩm đang bán, giá, tồn kho, size, màu, biến thể, khuyến mãi đang chạy hoặc đơn hàng.
Nếu không có nguồn từ tài liệu, hãy nói rõ chưa tìm thấy thông tin trong tài liệu hỗ trợ của CTUT UniShop.
Luôn trả lời bằng tiếng Việt, ngắn gọn, tự nhiên, không dùng markdown.
PROMPT;
    }

    private function intentClassifierPrompt(): string
    {
        return <<<PROMPT
Bạn là bộ phân loại ý định cho chatbot của CTUT UniShop.

Nhiệm vụ:
- Đọc câu người dùng.
- Chọn đúng 1 intent trong danh sách:
  small_talk, order_query, promotion_query, off_topic, static_knowledge, clarify, product_price, product_stock, product_variant, product_search, rag, unknown
- Nếu câu hỏi liên quan dữ liệu động như sản phẩm, giá, tồn kho, màu, size, biến thể, khuyến mãi đang có, đơn hàng thì phải ưu tiên intent động tương ứng.
- Chỉ trả static_knowledge khi câu hỏi là chính sách, hướng dẫn, liên hệ, đổi trả, thanh toán, giao nhận, giới thiệu cửa hàng hoặc FAQ.
- Nếu câu quá mơ hồ, thiếu tên sản phẩm, hoặc không đủ thông tin để biết người dùng đang hỏi gì thì trả clarify.
- Nếu câu nằm ngoài phạm vi cửa hàng CTUT UniShop thì trả off_topic.
- Không được tự bịa dữ liệu. Chỉ phân loại và trích xuất thực thể.

Thực thể cần trích xuất nếu có:
- product_query
- category_query
- department_query
- size
- color
- price_min
- price_max

Yêu cầu đầu ra:
- Chỉ trả đúng 1 object JSON hợp lệ.
- Không thêm giải thích, không thêm markdown, không thêm văn bản ngoài JSON.

Mẫu:
{
  "intent": "product_price",
  "confidence": 0.88,
  "product_query": "ao thun ctut",
  "category_query": null,
  "department_query": null,
  "size": "M",
  "color": "xanh",
  "price_min": null,
  "price_max": null
}
PROMPT;
    }
}
