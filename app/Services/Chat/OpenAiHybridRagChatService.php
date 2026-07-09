<?php

namespace App\Services\Chat;

use App\Jobs\SummarizeChatConversationJob;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class OpenAiHybridRagChatService
{
    public function __construct(
        protected ProductChatToolService $productToolService,
        protected ChatSessionService $sessionService,
        protected OpenAiStaticKnowledgeService $staticKnowledgeService
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
                ],
            ]);

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
            'promotion_query' => $this->handlePromotionIntent($message, $user),
            default => $this->dynamicEmptyResponse('rag', [], 'Hiện tại tôi chưa tìm thấy thông tin này trong hệ thống. Bạn vui lòng liên hệ bộ phận hỗ trợ của CTUT Store để được xác nhận.'),
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
                'product_name' => $productName,
                'size' => $entities['size'] ?? null,
                'color' => $entities['color'] ?? null,
            ],
            default => [
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
                'query' => $promotionQuery,
                'limit' => 6,
            ], $user);

            $toolCalls[] = [
                'name' => 'get_promotion_products',
                'arguments' => [
                    'query' => $promotionQuery,
                    'limit' => 6,
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
            'answer' => "Hiện CTUT Store đang có các chương trình khuyến mãi:\n{$lines}",
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
            'don hang', 'ma don', 'order', 'ord-', 'trang thai don', 'van chuyen',
        ]);
        $hasStaticKnowledgeSignal = $this->containsAny($text, [
            'chinh sach', 'faq', 'cau hoi thuong gap', 'huong dan', 'huong dan mua hang',
            'cach mua', 'cach dat hang', 'doi tra', 'hoan tien', 'hoan tra', 'bao hanh',
            'thanh toan', 'thanh toan khi nhan hang', 'cod', 'giao hang', 'nhan hang',
            'lien he', 'ho tro', 'gioi thieu', 'ctut unishop', 'ctut store',
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

        return [
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
        ];
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
        $query = preg_replace('/\b(shop oi|cho minh|giup minh|tu van|toi muon hoi|xin hoi|tim|kiem|xem|hoi|mua)\b/u', ' ', $query);
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
        if (preg_match('/\b(size|co|cỡ)?\s*(xs|s|m|l|xl|xxl|xxxl)\b/iu', $text, $matches)) {
            return mb_strtoupper($matches[2]);
        }

        return null;
    }

    private function extractColor(string $text): ?string
    {
        foreach (['xanh navy', 'navy', 'xanh', 'do', 'den', 'trang', 'vang', 'tim', 'hong', 'xam', 'nau', 'cam'] as $color) {
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
}
