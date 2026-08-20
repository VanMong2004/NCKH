<?php

namespace App\Services\Chat;

use App\Models\ChatConversation;
use App\Models\ChatKnowledgeFile;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class OpenAiStaticKnowledgeService
{
    private const SAFE_FALLBACK = 'Mình chưa tìm thấy thông tin này trong tài liệu hỗ trợ của CTUT UniShop.';

    public function __construct(
        protected ChatSessionService $sessionService,
        protected ChatbotApprovedAnswerService $approvedAnswerService
    ) {}

    public function answer(ChatConversation $conversation, string $latestMessage): array
    {
        $approved = $this->approvedAnswerService->findBestMatch($latestMessage, 'static_knowledge');

        if ($approved !== null) {
            return [
                'response_id' => null,
                'answer' => $approved['answer'],
                'intent' => 'static_knowledge',
                'sources' => [],
                'tool_calls' => [],
                'products' => [],
                'promotions' => [],
                'debug' => [
                    'source_used' => 'approved_answer_library',
                    'answer_id' => $approved['id'],
                    'match_type' => $approved['match_type'],
                    'confidence' => $approved['confidence'],
                    'lexical_score' => $approved['lexical_score'] ?? null,
                    'semantic_score' => $approved['semantic_score'] ?? null,
                ],
            ];
        }

        $response = $this->createResponse($this->buildPayload($conversation, $latestMessage));
        $answer = $this->sanitizeAnswer($this->extractAnswer($response));
        $sources = $this->filterValidSources($this->extractSources($response));
        $fileSearchResults = $this->extractFileSearchResults($response);
        $hasFileSearchResults = !empty($fileSearchResults);

        if ($answer === '' || empty($sources) || !$hasFileSearchResults) {
            $answer = self::SAFE_FALLBACK;
        }

        return [
            'response_id' => $response['id'] ?? null,
            'answer' => $answer,
            'intent' => 'static_knowledge',
            'sources' => $sources,
            'tool_calls' => [[
                'name' => 'file_search',
                'arguments' => [
                    'vector_store_id' => config('services.openai.vector_store_id'),
                    'max_num_results' => (int) config('services.openai.static_knowledge_max_results', 5),
                ],
                'result' => [
                    'found' => $hasFileSearchResults,
                    'results_count' => count($fileSearchResults),
                    'sources_count' => count($sources),
                ],
                'summary' => [
                    'name' => 'file_search',
                    'found' => $hasFileSearchResults,
                    'source_count' => count($sources),
                ],
            ]],
            'products' => [],
            'promotions' => [],
            'debug' => [
                'source_used' => 'vector_store',
                'source_count' => count($sources),
                'has_file_search_results' => $hasFileSearchResults,
                'approved_answer_checked' => true,
                'prompt_id_used' => $this->hasStaticPromptId(),
                'prompt_version' => config('services.openai.static_prompt_version'),
            ],
        ];
    }

    private function buildPayload(ChatConversation $conversation, string $latestMessage): array
    {
        $vectorStoreId = config('services.openai.vector_store_id');

        if (!$vectorStoreId) {
            throw new RuntimeException('Chưa cấu hình kho tài liệu tri thức cho chatbot', 500);
        }

        $payload = [
            'model' => config('services.openai.chat_model'),
            'input' => $this->buildInput($conversation, $latestMessage),
            'tools' => [[
                'type' => 'file_search',
                'vector_store_ids' => [$vectorStoreId],
                'max_num_results' => (int) config('services.openai.static_knowledge_max_results', 5),
            ]],
            'tool_choice' => 'required',
            'include' => ['file_search_call.results'],
            'max_output_tokens' => 700,
        ];

        if ($this->hasStaticPromptId()) {
            $payload['prompt'] = [
                'id' => config('services.openai.static_prompt_id'),
            ];

            $version = trim((string) config('services.openai.static_prompt_version'));
            if ($version !== '') {
                $payload['prompt']['version'] = $version;
            }
        } else {
            $payload['instructions'] = $this->fallbackInstructions();
        }

        return $payload;
    }

    private function buildInput(ChatConversation $conversation, string $latestMessage): array
    {
        $limit = (int) config('services.openai.chat_max_history', 12);
        $limit = max(6, min($limit, 12));
        $messages = $this->sessionService->recentMessages($conversation, $limit);

        $input = $messages
            ->map(fn ($message) => [
                'role' => $message->role,
                'content' => $message->content,
            ])
            ->values()
            ->toArray();

        $lastInput = end($input) ?: [];
        $lastContent = trim((string) ($lastInput['content'] ?? ''));
        if ($lastContent !== trim($latestMessage)) {
            $input[] = [
                'role' => 'user',
                'content' => $latestMessage,
            ];
        }

        return $input;
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

        foreach ($this->extractFileSearchResults($response) as $result) {
            $sources[] = [
                'type' => 'file_search_result',
                'file_id' => $result['file_id'] ?? null,
                'filename' => $result['filename'] ?? null,
                'quote' => $result['text'] ?? null,
                'score' => $result['score'] ?? null,
            ];
        }

        return collect($sources)
            ->filter(fn ($source) => !empty($source['file_id']) || !empty($source['filename']))
            ->unique(fn ($source) => ($source['file_id'] ?? '') . '|' . ($source['filename'] ?? '') . '|' . ($source['quote'] ?? ''))
            ->values()
            ->toArray();
    }

    private function extractFileSearchResults(array $response): array
    {
        $results = [];

        foreach (($response['output'] ?? []) as $item) {
            if (($item['type'] ?? null) !== 'file_search_call') {
                continue;
            }

            foreach (($item['results'] ?? []) as $result) {
                $results[] = [
                    'file_id' => $result['file_id'] ?? null,
                    'filename' => $result['filename'] ?? null,
                    'score' => $result['score'] ?? null,
                    'text' => $this->extractResultText($result),
                ];
            }
        }

        return collect($results)
            ->filter(fn ($result) => !empty($result['file_id']) || !empty($result['filename']))
            ->values()
            ->toArray();
    }

    private function extractResultText(array $result): ?string
    {
        $content = $result['content'] ?? null;

        if (is_string($content)) {
            return $content;
        }

        if (!is_array($content)) {
            return null;
        }

        return collect($content)
            ->map(fn ($item) => is_array($item) ? ($item['text'] ?? null) : null)
            ->filter()
            ->implode("\n");
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

    private function hasStaticPromptId(): bool
    {
        return trim((string) config('services.openai.static_prompt_id')) !== '';
    }

    private function fallbackInstructions(): string
    {
        return <<<PROMPT
Bạn là trợ lý tài liệu tĩnh của CTUT UniShop.
Chỉ trả lời dựa trên kết quả file_search từ kho tài liệu tri thức.
Không trả lời về dữ liệu động như sản phẩm đang bán, giá, tồn kho, size, màu, khuyến mãi hoặc đơn hàng.
Nếu không tìm thấy nguồn phù hợp trong tài liệu, hãy trả lời đúng câu: Mình chưa tìm thấy thông tin này trong tài liệu hỗ trợ của CTUT UniShop.
Luôn trả lời bằng tiếng Việt, ngắn gọn, tự nhiên, không dùng markdown.
PROMPT;
    }

    private function filterValidSources(array $sources): array
    {
        if (empty($sources)) {
            return [];
        }

        $fileIds = collect($sources)
            ->pluck('file_id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        if (empty($fileIds)) {
            return $sources;
        }

        $knowledgeFiles = ChatKnowledgeFile::query()
            ->whereIn('openai_file_id', $fileIds)
            ->get()
            ->keyBy('openai_file_id');

        return collect($sources)
            ->filter(function ($source) use ($knowledgeFiles) {
                $fileId = $source['file_id'] ?? null;

                if (!$fileId) {
                    return !empty($source['filename']);
                }

                if (!$knowledgeFiles->has($fileId)) {
                    return true;
                }

                $file = $knowledgeFiles->get($fileId);
                $now = now();

                if (!$file->is_active || $file->status !== 'completed') {
                    return false;
                }

                if ($file->effective_from && $file->effective_from->gt($now)) {
                    return false;
                }

                if ($file->effective_to && $file->effective_to->lt($now)) {
                    return false;
                }

                return true;
            })
            ->values()
            ->toArray();
    }
}
