<?php

namespace App\Services\Chat;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class OpenAiHybridRagChatService
{
    public function __construct(
        protected ProductChatToolService $productToolService
    ) {}

    public function sendMessage($user, ?string $guestToken, ?int $conversationId, string $message): array
    {
        $message = trim($message);

        if ($message === '') {
            throw new RuntimeException('Vui lòng nhập nội dung cần tư vấn', 422);
        }

        $guestToken = $guestToken ?: (string) Str::uuid();

        return DB::transaction(function () use ($user, $guestToken, $conversationId, $message) {
            $conversation = $this->resolveConversation($user, $guestToken, $conversationId, $message);

            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'user',
                'content' => $message,
            ]);

            $conversation->update([
                'last_message_at' => now(),
            ]);

            $openAiResult = $this->askOpenAi($conversation, $user);

            $assistantMessage = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $openAiResult['answer'],
                'sources' => $openAiResult['sources'],
                'tool_calls' => $openAiResult['tool_calls'],
                'metadata' => [
                    'response_id' => $openAiResult['response_id'],
                    'model' => config('services.openai.chat_model'),
                ],
            ]);

            $conversation->update([
                'last_message_at' => now(),
            ]);

            return [
                'conversation_id' => $conversation->id,
                'guest_token' => $conversation->guest_token,
                'message_id' => $assistantMessage->id,
                'answer' => $assistantMessage->content,
                'sources' => $assistantMessage->sources ?? [],
                'tool_calls' => $assistantMessage->tool_calls ?? [],
                'products' => $openAiResult['products'] ?? [],
            ];
        });
    }

    public function conversations($user, ?string $guestToken = null)
    {
        $query = ChatConversation::query()
            ->withCount('messages')
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
                'last_message_at' => optional($conversation->last_message_at)->format('d/m/Y H:i'),
                'messages_count' => (int) $conversation->messages_count,
            ])
            ->values();
    }

    public function conversationDetail($user, ?string $guestToken, int $conversationId): array
    {
        $conversation = $this->ownedConversationQuery($user, $guestToken)
            ->with('messages')
            ->find($conversationId);

        if (!$conversation) {
            throw new RuntimeException('Không tìm thấy hội thoại', 404);
        }

        return [
            'id' => $conversation->id,
            'title' => $conversation->title,
            'guest_token' => $conversation->guest_token,
            'messages' => $conversation->messages
                ->map(fn ($message) => [
                    'id' => $message->id,
                    'role' => $message->role,
                    'content' => $message->content,
                    'sources' => $message->sources ?? [],
                    'tool_calls' => $message->tool_calls ?? [],
                    'created_at' => optional($message->created_at)->format('d/m/Y H:i'),
                ])
                ->values(),
        ];
    }

    private function resolveConversation($user, string $guestToken, ?int $conversationId, string $message): ChatConversation
    {
        if ($conversationId) {
            $conversation = $this->ownedConversationQuery($user, $guestToken)
                ->lockForUpdate()
                ->find($conversationId);

            if (!$conversation) {
                throw new RuntimeException('Không tìm thấy hội thoại', 404);
            }

            return $conversation;
        }

        return ChatConversation::create([
            'user_id' => $user?->id,
            'guest_token' => $user ? null : $guestToken,
            'title' => Str::limit($message, 80),
            'last_message_at' => now(),
        ]);
    }

    private function ownedConversationQuery($user, ?string $guestToken)
    {
        $query = ChatConversation::query();

        if ($user) {
            return $query->where('user_id', $user->id);
        }

        return $query->where('guest_token', $guestToken);
    }

    private function askOpenAi(ChatConversation $conversation, $user): array
    {
        $tools = $this->tools();

        $response = $this->createResponse([
            'model' => config('services.openai.chat_model'),
            'instructions' => $this->systemPrompt(),
            'input' => $this->buildInput($conversation),
            'tools' => $tools,
        ]);

        $allToolCalls = [];
        $loop = 0;

        while ($loop < 3) {
            $loop++;

            $toolCalls = $this->extractFunctionCalls($response);

            if (empty($toolCalls)) {
                break;
            }

            $toolOutputs = [];

            foreach ($toolCalls as $toolCall) {
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
                ];

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
            ]);
        }

        $answer = $this->extractAnswer($response);

        if (!$answer) {
            $answer = 'Hiện tại tôi chưa tìm thấy thông tin phù hợp trong hệ thống. Bạn vui lòng liên hệ bộ phận hỗ trợ của CTUT Store để được xác nhận.';
        }

        return [
            'response_id' => $response['id'] ?? null,
            'answer' => $answer,
            'sources' => $this->extractSources($response),
            'tool_calls' => $allToolCalls,
            'products' => $this->extractProductsFromToolCalls($allToolCalls),
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
                ->timeout(120)
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

        $messages = ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->whereIn('role', ['user', 'assistant'])
            ->latest()
            ->limit($limit)
            ->get()
            ->sortBy('id')
            ->values();

        return $messages
            ->map(fn ($message) => [
                'role' => $message->role,
                'content' => $message->content,
            ])
            ->toArray();
    }

    private function tools(): array
    {
        $tools = [];

        $vectorStoreId = config('services.openai.vector_store_id');

        if ($vectorStoreId) {
            $tools[] = [
                'type' => 'file_search',
                'vector_store_ids' => [$vectorStoreId],
                'max_num_results' => 5,
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
        ];
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