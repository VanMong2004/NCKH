<?php

namespace App\Services\Chat;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Jobs\SummarizeChatConversationJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class OpenAiHybridRagChatService
{
    public function __construct(
        protected ProductChatToolService $productToolService,
        protected ChatSessionService $sessionService
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
                ],
            ]);

            $this->sessionService->touchSession($conversation);

            return [
                'conversation_id' => $conversation->id,
                'guest_token' => $conversation->guest_token,
                'parent_message_id' => $userMessage->id,
                'message_id' => $assistantMessage->id,
                'answer' => $assistantMessage->content,
                'sources' => [],
                'tool_calls' => [],
                'products' => $openAiResult['products'] ?? [],
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
        $intent = $this->detectIntent($latestMessage);
        $tools = $this->tools();

        $response = $this->createResponse([
            'model' => config('services.openai.chat_model'),
            'instructions' => $this->systemPrompt(),
            'input' => $this->buildInput($conversation),
            'tools' => $tools,
            'max_output_tokens' => 700,
        ]);

        $allToolCalls = [];
        $toolDurationMs = 0;
        $loop = 0;

        while ($loop < 3) {
            $loop++;

            $toolCalls = $this->extractFunctionCalls($response);

            if (empty($toolCalls)) {
                break;
            }

            $toolOutputs = [];

            foreach ($toolCalls as $toolCall) {
                $toolStartedAt = microtime(true);
                $arguments = json_decode($toolCall['arguments'] ?? '{}', true) ?: [];

                $result = $this->productToolService->execute(
                    $toolCall['name'],
                    $arguments,
                    $user
                );

                $allToolCalls[] = [
                    'name' => $toolCall['name'],
                    'arguments' => $arguments,
                    'result' => $result,
                    'summary' => $this->summarizeToolResult($toolCall['name'], $result),
                ];
                $toolDurationMs += (int) round((microtime(true) - $toolStartedAt) * 1000);

                $toolOutputs[] = [
                    'type' => 'function_call_output',
                    'call_id' => $toolCall['call_id'],
                    'output' => json_encode($result, JSON_UNESCAPED_UNICODE),
                ];
            }

            $response = $this->createResponse([
                'model' => config('services.openai.chat_model'),
                'instructions' => $this->systemPrompt(),
                'previous_response_id' => $response['id'] ?? null,
                'input' => $toolOutputs,
                'tools' => $tools,
                'max_output_tokens' => 700,
            ]);
        }

        $answer = $this->extractAnswer($response);
        $sources = $this->extractSources($response);
        $products = $this->extractProductsFromToolCalls($allToolCalls);
        $answer = $this->normalizeFallbackAnswer($answer, $intent, $allToolCalls, $sources);
        $answer = $this->sanitizeAnswer($answer);

        if (!$answer) {
            $answer = 'Hiện tại tôi chưa tìm thấy thông tin phù hợp trong hệ thống. Bạn vui lòng liên hệ bộ phận hỗ trợ của CTUT Store để được xác nhận.';
        }

        return [
            'response_id' => $response['id'] ?? null,
            'answer' => $answer,
            'intent' => $intent,
            'sources' => $sources,
            'tool_calls' => $allToolCalls,
            'products' => $products,
            'debug' => [
                'intent' => $intent,
                'tool_count' => count($allToolCalls),
                'tool_names' => collect($allToolCalls)->pluck('name')->unique()->values()->toArray(),
                'product_count' => count($products),
                'source_count' => count($sources),
                'tool_duration_ms' => $toolDurationMs,
                'total_duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ],
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
                ->timeout(75)
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
        $limit = max(12, min($limit, 16));

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
        $tools = [];

        $vectorStoreId = config('services.openai.vector_store_id');

        if ($vectorStoreId) {
            $tools[] = [
                'type' => 'file_search',
                'vector_store_ids' => [$vectorStoreId],
                'max_num_results' => 3,
            ];
        }

        return array_merge($tools, $this->productTools());
    }

    private function productTools(): array
    {
        return [
            [
                'type' => 'function',
                'name' => 'get_product_by_name',
                'description' => 'Lấy thông tin chi tiết sản phẩm từ database Laravel theo tên sản phẩm.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'name' => [
                            'type' => 'string',
                            'description' => 'Tên hoặc một phần tên sản phẩm khách hàng hỏi.',
                        ],
                    ],
                    'required' => ['name'],
                    'additionalProperties' => false,
                ],
            ],
            [
                'type' => 'function',
                'name' => 'search_products',
                'description' => 'Tìm danh sách sản phẩm phù hợp nhu cầu khách hàng từ database Laravel.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'query' => [
                            'type' => 'string',
                            'description' => 'Từ khóa hoặc nhu cầu tìm sản phẩm.',
                        ],
                        'limit' => [
                            'type' => 'integer',
                            'description' => 'Số sản phẩm tối đa cần trả về.',
                        ],
                    ],
                    'required' => ['query'],
                    'additionalProperties' => false,
                ],
            ],
            [
                'type' => 'function',
                'name' => 'get_product_recommendations',
                'description' => 'Lấy danh sách sản phẩm nổi bật, hot, phổ biến, bán chạy, mới nhất hoặc đánh giá cao từ database Laravel.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'type' => [
                            'type' => 'string',
                            'enum' => ['popular', 'featured', 'best_selling', 'top_rated', 'newest'],
                            'description' => 'Loại gợi ý: popular/hot/phổ biến, featured/nổi bật, best_selling/bán chạy, top_rated/đánh giá cao, newest/mới nhất.',
                        ],
                        'limit' => [
                            'type' => 'integer',
                            'description' => 'Số sản phẩm tối đa cần trả về.',
                        ],
                    ],
                    'required' => ['type'],
                    'additionalProperties' => false,
                ],
            ],
            [
                'type' => 'function',
                'name' => 'get_product_stock',
                'description' => 'Lấy tồn kho mới nhất theo sản phẩm/kích thước/màu sắc từ database Laravel.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'product_name' => [
                            'type' => 'string',
                            'description' => 'Tên sản phẩm.',
                        ],
                        'size' => [
                            'type' => 'string',
                            'description' => 'Kích thước nếu khách hàng có hỏi.',
                        ],
                        'color' => [
                            'type' => 'string',
                            'description' => 'Màu sắc nếu khách hàng có hỏi.',
                        ],
                    ],
                    'required' => ['product_name'],
                    'additionalProperties' => false,
                ],
            ],
            [
                'type' => 'function',
                'name' => 'get_product_price',
                'description' => 'Lấy giá mới nhất theo sản phẩm/kích thước/màu sắc từ database Laravel.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'product_name' => [
                            'type' => 'string',
                            'description' => 'Tên sản phẩm.',
                        ],
                        'size' => [
                            'type' => 'string',
                            'description' => 'Kích thước nếu khách hàng có hỏi.',
                        ],
                        'color' => [
                            'type' => 'string',
                            'description' => 'Màu sắc nếu khách hàng có hỏi.',
                        ],
                    ],
                    'required' => ['product_name'],
                    'additionalProperties' => false,
                ],
            ],
            [
                'type' => 'function',
                'name' => 'get_product_variants',
                'description' => 'Lấy danh sách biến thể size/màu/giá/tồn kho mới nhất của sản phẩm từ database Laravel.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'product_name' => [
                            'type' => 'string',
                            'description' => 'Tên sản phẩm.',
                        ],
                    ],
                    'required' => ['product_name'],
                    'additionalProperties' => false,
                ],
            ],
            [
                'type' => 'function',
                'name' => 'get_promotion_by_name',
                'description' => 'Lay chi tiet mot chuong trinh khuyen mai dang dien ra tu database Laravel.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'name' => [
                            'type' => 'string',
                            'description' => 'Ten hoac mot phan ten chuong trinh khuyen mai.',
                        ],
                    ],
                    'required' => ['name'],
                    'additionalProperties' => false,
                ],
            ],
            [
                'type' => 'function',
                'name' => 'search_promotions',
                'description' => 'Tim danh sach chuong trinh khuyen mai dang hieu luc theo tu khoa tu database Laravel.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'query' => [
                            'type' => 'string',
                            'description' => 'Tu khoa khuyen mai nhu tan sinh vien, giam gia, uu dai.',
                        ],
                        'limit' => [
                            'type' => 'integer',
                            'description' => 'So khuyen mai toi da can tra ve.',
                        ],
                    ],
                    'required' => ['query'],
                    'additionalProperties' => false,
                ],
            ],
            [
                'type' => 'function',
                'name' => 'get_active_promotions',
                'description' => 'Lay danh sach khuyen mai dang dien ra tai CTUT Store tu database Laravel.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'limit' => [
                            'type' => 'integer',
                            'description' => 'So khuyen mai toi da can tra ve.',
                        ],
                    ],
                    'additionalProperties' => false,
                ],
            ],
            [
                'type' => 'function',
                'name' => 'get_promotion_products',
                'description' => 'Lay danh sach san pham nam trong mot chuong trinh khuyen mai dang dien ra tai CTUT Store.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'query' => [
                            'type' => 'string',
                            'description' => 'Ten chuong trinh khuyen mai hoac tu khoa lien quan. De trong neu khach hoi chung ve san pham trong cac khuyen mai dang dien ra.',
                        ],
                        'limit' => [
                            'type' => 'integer',
                            'description' => 'So san pham toi da can tra ve.',
                        ],
                    ],
                    'additionalProperties' => false,
                ],
            ],
        ];
    }

    private function detectIntent(string $message): string
    {
        $normalized = mb_strtolower(Str::ascii(trim($message)));

        if ($normalized === '') {
            return 'unknown';
        }

        if (preg_match('/\b(best selling|ban chay|hot|popular|noi bat|top rated|high rating|danh gia cao|new products|latest|moi nhat)\b/u', $normalized)) {
            return 'product_recommendation';
        }

        if (preg_match('/\b(ao|thun|polo|hoodie|balo|tui|non|mu|binh|ly|but|sticker|moc khoa|san pham|product|price|gia|stock|ton kho|size|mau|color)\b/u', $normalized)) {
            return 'product_search';
        }

        if (preg_match('/\b(chinh sach|doi tra|van chuyen|thanh toan|bao hanh|huong dan|faq|policy|shipping|payment|return)\b/u', $normalized)) {
            return 'policy_question';
        }

        if (preg_match('/\b(khuyen mai|giam gia|uu dai|voucher|coupon|sale|deal|promo|promotion)\b/u', $normalized)) {
            return 'promotion_query';
        }

        return 'out_of_scope';
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
            'message' => $result['message'] ?? null,
            'type' => $result['type'] ?? null,
            'query' => $result['query'] ?? null,
            'keywords' => $result['keywords'] ?? [],
        ];
    }

    private function normalizeFallbackAnswer(string $answer, string $intent, array $toolCalls, array $sources): string
    {
        $answer = trim($answer);
        $hasProductTool = collect($toolCalls)->contains(fn ($toolCall) => str_starts_with((string) ($toolCall['name'] ?? ''), 'get_product')
            || ($toolCall['name'] ?? '') === 'search_products');
        $hasFoundProduct = collect($toolCalls)->contains(fn ($toolCall) => (bool) data_get($toolCall, 'summary.found'));

        if (in_array($intent, ['product_search', 'product_recommendation'], true) && $hasProductTool && !$hasFoundProduct) {
            return 'Mình chưa tìm thấy sản phẩm phù hợp trong hệ thống CTUT Store. Bạn có thể thử nhập tên sản phẩm cụ thể hơn, ví dụ áo thun, hoodie, balo, bình giữ nhiệt hoặc sản phẩm CTUT bạn đang cần tìm.';
        }

        $hasPromotionTool = collect($toolCalls)->contains(fn ($toolCall) => in_array(($toolCall['name'] ?? ''), [
            'get_promotion_by_name',
            'search_promotions',
            'get_active_promotions',
            'get_promotion_products',
        ], true));
        $hasFoundPromotion = collect($toolCalls)->contains(function ($toolCall) {
            $result = $toolCall['result'] ?? [];

            return !empty($result['promotion']) || !empty($result['promotions']) || !empty($result['products']);
        });

        if ($intent === 'promotion_query' && $hasPromotionTool && !$hasFoundPromotion) {
            return 'Hien tai minh chua tim thay khuyen mai phu hop trong he thong CTUT Store. Ban co the hoi ro hon theo ten chuong trinh hoac hoi "khuyen mai dang dien ra" de minh kiem tra giup ban.';
        }

        $badFallbacks = [
            'tài liệu không cung cấp',
            'dữ liệu không cung cấp',
            'không có trong tài liệu',
            'document does not provide',
            'uploaded a document',
            'solidity',
            'smart contract',
        ];

        $normalizedAnswer = mb_strtolower(Str::ascii($answer));
        $hasBadFallback = collect($badFallbacks)->contains(fn ($text) => str_contains($normalizedAnswer, Str::ascii($text)));

        if ($intent === 'out_of_scope' && (empty($sources) || $hasBadFallback)) {
            return 'Mình chủ yếu hỗ trợ thông tin về sản phẩm, đơn hàng, thanh toán và chính sách của CTUT Store. Với nội dung này, bạn nên xem kênh thông tin chính thức phù hợp để được tư vấn chính xác hơn nhé.';
        }

        return $answer;
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
        $products = collect($toolCalls)
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
            ->take(3)
            ->values()
            ->toArray();

        return $products;
    }

    private function extractFunctionCalls(array $response): array
    {
        $calls = [];

        foreach (($response['output'] ?? []) as $item) {
            if (($item['type'] ?? null) === 'function_call') {
                $calls[] = [
                    'call_id' => $item['call_id'] ?? null,
                    'name' => $item['name'] ?? null,
                    'arguments' => $item['arguments'] ?? '{}',
                ];
            }
        }

        return array_values(array_filter($calls, fn ($call) => $call['call_id'] && $call['name']));
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

    private function systemPrompt(): string
    {
        return <<<PROMPT
    NGÔN NGỮ:
    - Luôn trả lời bằng tiếng Việt, kể cả khi khách hỏi bằng tiếng Anh hoặc ngôn ngữ khác.
    - Nếu khách hỏi tiếng Anh nhưng nội dung mơ hồ/ngoài phạm vi như "what news?", "what's new?", "tell me news", hãy trả lời ngắn gọn bằng tiếng Việt rằng mình chủ yếu hỗ trợ sản phẩm, đơn hàng, thanh toán và chính sách của CTUT Store; không tự lấy tài liệu không liên quan để trả lời.
    - Không trả lời bằng tiếng Anh trừ khi khách yêu cầu rõ "reply in English" hoặc "answer in English".
    - Không nhắc đến tài liệu, file, Vector Store, Solidity, smart contract hoặc nội dung ngoài CTUT Store nếu khách không hỏi đúng phạm vi đó.

    QUY TẮC TRẢ LỜI NGOÀI PHẠM VI:
    - Nếu khách hỏi nội dung không liên quan trực tiếp đến CTUT Store, sản phẩm, đơn hàng, thanh toán, vận chuyển, đổi trả, hướng dẫn mua hàng hoặc thông tin thương hiệu của shop, hãy trả lời tự nhiên và lịch sự.
    - Không nói máy móc kiểu "tài liệu không cung cấp" hoặc "dữ liệu không cung cấp".
    - Hãy nói rằng mình chủ yếu hỗ trợ CTUT Store và gợi ý người dùng liên hệ kênh phù hợp nếu cần thông tin chính xác.
    - Ví dụ với câu "ngành đào tạo": "Mình chủ yếu hỗ trợ thông tin sản phẩm, đơn hàng, thanh toán và chính sách của CTUT Store. Với thông tin ngành đào tạo, bạn nên xem website chính thức của CTUT hoặc liên hệ phòng đào tạo để được tư vấn chính xác nhất."

    Bạn là trợ lý bán hàng chính thức của CTUT Store.

    NHIỆM VỤ:
    - Tư vấn sản phẩm cho khách hàng.
    - Trả lời câu hỏi về giá, kích thước, màu sắc, tồn kho.
    - Gợi ý sản phẩm phù hợp với nhu cầu khách hàng.
    - Trả lời câu hỏi về chính sách đổi trả, vận chuyển, thanh toán, hướng dẫn mua hàng, hướng dẫn chọn size và thông tin thương hiệu CTUT.

    Quy tắc dữ liệu bắt buộc:
    1. Với mọi câu hỏi có liên quan đến sản phẩm, ví dụ:
    - shop có bán sản phẩm nào không
    - sản phẩm này giá bao nhiêu
    - còn hàng không
    - có size/màu nào
    - tư vấn/gợi ý sản phẩm
    - sản phẩm phù hợp làm quà tặng
    - khách hỏi tên một món hàng cụ thể
    - Nếu khách hỏi tiếng Việt không dấu, viết tắt hoặc thiếu dấu như "shop ban cac loa ao nao", hãy hiểu theo nghĩa gần đúng là "shop bán các loại áo nào" và vẫn gọi tool search_products.
    - Khi gọi search_products, nên truyền từ khóa sản phẩm chính, ví dụ: "ao", "balo", "non", "binh giu nhiet", thay vì truyền nguyên câu dài nếu có thể.

    Quy tắc sản phẩm theo gợi ý/xếp hạng:
    - Nếu khách hỏi "product hot", "hot products", "popular products", "sản phẩm hot", "sản phẩm nổi bật": gọi get_product_recommendations với type="popular" hoặc "featured".
    - Nếu khách hỏi "product high rate review", "top rated products", "high rating products", "sản phẩm đánh giá cao": gọi get_product_recommendations với type="top_rated".
    - Nếu khách hỏi "best selling products", "sản phẩm bán chạy": gọi get_product_recommendations với type="best_selling".
    - Nếu khách hỏi "new products", "latest products", "sản phẩm mới nhất": gọi get_product_recommendations với type="newest".

    Bắt buộc phải dùng tool/function gọi database Laravel trước.

    Không được dùng File Search để xác nhận sản phẩm có bán hay không.
    Không được dùng File Search để trả lời giá, tồn kho, size, màu, biến thể, sản phẩm hiện có.
    Nếu tool trả found=false hoặc products rỗng:
    - Phải nói rõ chưa tìm thấy sản phẩm phù hợp trong hệ thống.
    - Không được lấy tài liệu FAQ/thương hiệu để suy ra rằng shop có bán sản phẩm đó.

    2. Với thông tin động về sản phẩm như giá bán, biến thể, kích thước, màu sắc, tồn kho, tình trạng còn hàng:
    - Luôn dùng tool/function gọi database Laravel.
    - Không tự suy đoán giá, tồn kho, kích thước, màu sắc.

    3. Với thông tin tĩnh như chính sách đổi trả, vận chuyển, thanh toán, hướng dẫn mua hàng, hướng dẫn chọn size, giới thiệu thương hiệu CTUT:
    - Dùng File Search từ Vector Store.
    - Chỉ trả lời dựa trên nội dung tìm được trong tài liệu.

    4. Nếu không tìm thấy dữ liệu trong database hoặc tài liệu:
    - Nói rõ: "Hiện tại tôi chưa tìm thấy thông tin này trong hệ thống. Bạn vui lòng liên hệ bộ phận hỗ trợ của CTUT Store để được xác nhận."

    5. Không bịa thông tin.

    6. Trả lời ngắn gọn, thân thiện, rõ ràng như nhân viên chăm sóc khách hàng.

    7. Nếu có nhiều sản phẩm phù hợp, hãy liệt kê tối đa 5 sản phẩm, kèm tên, giá nếu có, và tình trạng tồn kho nếu tool cung cấp.

    8. Nếu tool trả về product_url thì luôn sử dụng đúng product_url. Không tự tạo URL. Không tự tạo link sản phẩm. Không tự tạo link ảnh.

    9. Không cần hiển thị link sản phẩm trong câu trả lời.

    10. Không cần hiển thị ảnh sản phẩm trong câu trả lời.

    11. Frontend sẽ tự hiển thị card sản phẩm từ dữ liệu tool trả về.

    12. Khi có sản phẩm phù hợp, chỉ trả lời phần tư vấn ngắn gọn, không tự tạo Markdown link hoặc Markdown ảnh.

    PROMPT;
    }
    // NGUYÊN TẮC:
    // - Luôn trả lời bằng tiếng Việt.
    // - Trả lời tự nhiên như nhân viên tư vấn.
    // - Ngắn gọn.
    // - Không lan man.
    // - Không giải thích dài nếu khách không hỏi.

    // ĐỊNH DẠNG:
    //     Không sử dụng Markdown.
    //     Không dùng:
    //     *
    //     **
    //     #
    //     ##
    //     ###
    //     __
    //     ---
    //     >
    //     `
    //     Không tạo bảng.
    //     Không dùng code block.
    //     Không in ký tự Markdown.
    //     Chỉ dùng xuống dòng và dấu "-" khi cần.

    // SẢN PHẨM:
    //     Nếu tool trả về nhiều sản phẩm:
    //         - Chỉ giới thiệu tối đa 3 sản phẩm phù hợp nhất.
    //     Mỗi sản phẩm chỉ cần:
    //         Tên
    //         Giá
    //         Khuyến mãi (nếu có)
    //         Tồn kho
    //         Màu
    //         Size
    //         Không liệt kê toàn bộ dữ liệu.

    // HÌNH ẢNH
    //     Nếu sản phẩm có image_url
    //     hãy trả:
    //     <image>
    //     image_url
    //     </image>
    //     Không tự tạo URL.
    //     Không suy đoán URL.

    // LINK
    //     Nếu có product_url
    //     hãy trả:
    //     <link>
    //     product_url
    //     </link>
    //     Không tự tạo link.

    // KHÔNG TÌM THẤY
    //     Nếu không có dữ liệu:
    //     "Xin lỗi, hiện mình chưa tìm thấy sản phẩm phù hợp."
    //     Không được tự bịa.

    // GIỌNG ĐIỆU
    //     Không dùng:
    //     "Dưới đây là..."
    //     "Theo dữ liệu..."
    //     "Tôi tìm thấy..."
    //     "Thông tin như sau..."
    //     Hãy trả lời như nhân viên bán hàng.
    //     Ví dụ:
    //     "Hiện shop có một số mẫu áo CTUT phù hợp với nhu cầu của bạn."

    // QUAN TRỌNG
    //     Chỉ sử dụng dữ liệu từ:
    //     - File Search
    //     - Function Tool
    //     Không được tự tạo:
    //     Giá
    //     Khuyến mãi
    //     Ảnh
    //     Link
    //     Tồn kho
    //     Tên sản phẩm
    
}
