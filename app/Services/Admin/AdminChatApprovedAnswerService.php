<?php

namespace App\Services\Admin;

use App\Models\ChatMessage;
use App\Models\ChatbotApprovedAnswer;
use App\Services\Chat\ChatbotApprovedAnswerService;
use RuntimeException;

class AdminChatApprovedAnswerService
{
    public function __construct(
        protected ChatbotApprovedAnswerService $approvedAnswerService
    ) {}

    public function list(array $filters = [])
    {
        $query = ChatbotApprovedAnswer::query()->latest();

        if (!empty($filters['keyword'])) {
            $keyword = trim((string) $filters['keyword']);
            $query->where(function ($builder) use ($keyword) {
                $builder->where('question', 'like', "%{$keyword}%")
                    ->orWhere('answer', 'like', "%{$keyword}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '') {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        return $query->paginate(15);
    }

    public function show(int $id): ChatbotApprovedAnswer
    {
        return ChatbotApprovedAnswer::query()->findOrFail($id);
    }

    public function store(array $data, $user): ChatbotApprovedAnswer
    {
        return ChatbotApprovedAnswer::query()->create(
            $this->approvedAnswerService->preparePayload($data, $user)
        );
    }

    public function update(int $id, array $data, $user): ChatbotApprovedAnswer
    {
        $answer = ChatbotApprovedAnswer::query()->findOrFail($id);
        $answer->update(
            $this->approvedAnswerService->preparePayload($data, $user, $answer)
        );

        return $answer->fresh();
    }

    public function toggle(int $id): ChatbotApprovedAnswer
    {
        $answer = ChatbotApprovedAnswer::query()->findOrFail($id);
        $answer->update([
            'is_active' => !$answer->is_active,
        ]);

        return $answer->fresh();
    }

    public function destroy(int $id): array
    {
        $answer = ChatbotApprovedAnswer::query()->findOrFail($id);
        $answer->delete();

        return ['deleted' => true];
    }

    public function promoteFromMessage(int $messageId, $user): ChatbotApprovedAnswer
    {
        $message = ChatMessage::query()->find($messageId);

        if (!$message || $message->role !== 'assistant') {
            throw new RuntimeException('Không tìm thấy tin nhắn AI để tạo thư viện câu trả lời', 404);
        }

        $question = $message->parent?->content;
        $answer = trim((string) $message->content);

        if (!$question || $answer === '') {
            throw new RuntimeException('Không đủ dữ liệu để tạo bản nháp câu trả lời', 422);
        }

        return ChatbotApprovedAnswer::query()->create(
            $this->approvedAnswerService->preparePayload([
                'question' => $question,
                'answer' => $answer,
                'intent' => data_get($message->metadata, 'intent', 'static_knowledge'),
                'status' => 'draft',
                'source_type' => 'chat_message',
                'source_reference' => 'chat_message:' . $message->id,
            ], $user)
        );
    }
}
