<?php

namespace App\Services\Chat;

use App\Models\ChatConversation;
use App\Models\ChatConversationSummary;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class ChatConversationSummaryService
{
    public function summarize(int $conversationId): void
    {
        $conversation = ChatConversation::query()
            ->with('summary')
            ->find($conversationId);

        if (!$conversation) {
            return;
        }

        $messages = ChatMessage::query()
            ->select(['id', 'role', 'content', 'created_at'])
            ->where('conversation_id', $conversation->id)
            ->whereIn('role', ['user', 'assistant'])
            ->orderBy('id')
            ->get();

        $threshold = (int) config('services.openai.chat_summary_threshold', 30);

        if ($messages->count() < $threshold) {
            return;
        }

        $currentSummary = trim((string) $conversation->summary?->summary);
        $summarizedUntilMessageId = (int) data_get($conversation->summary?->metadata, 'summarized_until_message_id', 0);
        $messagesToKeep = 12;
        $cutoffMessageId = $messages
            ->slice(0, max(0, $messages->count() - $messagesToKeep))
            ->last()?->id;

        $messagesForSummary = $messages
            ->filter(fn ($message) => $cutoffMessageId && $message->id > $summarizedUntilMessageId && $message->id <= $cutoffMessageId)
            ->values();

        if ($messagesForSummary->isEmpty()) {
            return;
        }

        $summary = $this->createSummary(
            $currentSummary,
            $messagesForSummary
                ->map(fn ($message) => strtoupper($message->role) . ': ' . $message->content)
                ->implode("\n")
        );

        if ($summary === '') {
            return;
        }

        ChatConversationSummary::query()->updateOrCreate(
            ['conversation_id' => $conversation->id],
            [
                'summary' => $summary,
                'metadata' => [
                    'message_count' => $messages->count(),
                    'summarized_until_message_id' => $messagesForSummary->last()?->id,
                    'updated_by' => 'SummarizeChatConversationJob',
                ],
            ]
        );
    }

    private function createSummary(string $currentSummary, string $messages): string
    {
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            throw new RuntimeException('Chưa cấu hình OPENAI_API_KEY', 500);
        }

        $baseUrl = rtrim(config('services.openai.base_url'), '/');

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(60)
                ->post($baseUrl . '/responses', [
                    'model' => config('services.openai.chat_model'),
                    'instructions' => 'Tóm tắt hội thoại bán hàng CTUT UniShop bằng tiếng Việt. Giữ lại: nhu cầu khách hàng, sản phẩm đã hỏi, size/màu/giá/tồn kho quan trọng, đơn hàng/chính sách liên quan, các ràng buộc cần nhớ. Viết ngắn gọn, không quá 180 từ.',
                    'input' => [
                        [
                            'role' => 'user',
                            'content' => trim("Tóm tắt hiện tại:\n{$currentSummary}\n\nTin nhắn cũ cần gom:\n{$messages}"),
                        ],
                    ],
                    'max_output_tokens' => 500,
                ])
                ->throw()
                ->json();

            return trim((string) ($response['output_text'] ?? $this->extractOutputText($response)));
        } catch (Throwable $e) {
            throw new RuntimeException('Không thể tóm tắt hội thoại: ' . $e->getMessage(), 500);
        }
    }

    private function extractOutputText(array $response): string
    {
        $text = '';

        foreach (($response['output'] ?? []) as $item) {
            foreach (($item['content'] ?? []) as $content) {
                if (($content['type'] ?? null) === 'output_text') {
                    $text .= "\n" . ($content['text'] ?? '');
                }
            }
        }

        return trim($text);
    }
}
