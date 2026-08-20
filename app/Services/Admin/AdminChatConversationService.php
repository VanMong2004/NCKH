<?php

namespace App\Services\Admin;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Carbon\Carbon;
use RuntimeException;

class AdminChatConversationService
{
    public function statistics(): array
    {
        return [
            'total_sessions' => ChatConversation::query()->count(),
            'active_sessions' => ChatConversation::query()->where('status', 'active')->count(),
            'expired_sessions' => ChatConversation::query()->where('status', 'expired')->count(),
            'closed_sessions' => ChatConversation::query()->where('status', 'closed')->count(),
            'total_messages' => ChatMessage::query()->count(),
            'user_messages' => ChatMessage::query()->where('role', 'user')->count(),
            'assistant_messages' => ChatMessage::query()->where('role', 'assistant')->count(),
        ];
    }

    public function list(array $filters = [])
    {
        $query = ChatConversation::query()
            ->with(['summary', 'user:id,name,email'])
            ->withCount('messages');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim((string) $filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('guest_token', 'like', "%{$keyword}%")
                    ->orWhereHas('user', function ($userQuery) use ($keyword) {
                        $userQuery->where('name', 'like', "%{$keyword}%")
                            ->orWhere('email', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('messages', function ($messageQuery) use ($keyword) {
                        $messageQuery->where('content', 'like', "%{$keyword}%");
                    });
            });
        }

        if (!empty($filters['date_from'])) {
            $query->where('last_message_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (!empty($filters['date_to'])) {
            $query->where('last_message_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        $sort = $filters['sort'] ?? 'latest';

        match ($sort) {
            'oldest' => $query->oldest('last_message_at')->oldest(),
            'most_messages' => $query->orderByDesc('messages_count')->latest('last_message_at'),
            default => $query->latest('last_message_at')->latest(),
        };

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 50);

        return $query
            ->paginate($perPage)
            ->through(fn (ChatConversation $conversation) => $this->formatConversation($conversation));
    }

    public function show(int $id): array
    {
        $conversation = ChatConversation::query()
            ->with(['summary', 'user:id,name,email'])
            ->withCount('messages')
            ->findOrFail($id);

        $messages = ChatMessage::query()
            ->select(['id', 'conversation_id', 'parent_message_id', 'role', 'content', 'sources', 'tool_calls', 'metadata', 'created_at'])
            ->where('conversation_id', $conversation->id)
            ->orderBy('id')
            ->limit(100)
            ->get()
            ->map(fn (ChatMessage $message) => [
                'id' => $message->id,
                'parent_message_id' => $message->parent_message_id,
                'role' => $message->role,
                'content' => $message->content,
                'sources' => $message->sources ?? [],
                'tool_calls' => $message->tool_calls ?? [],
                'metadata' => $message->metadata ?? [],
                'products' => data_get($message->metadata, 'products', []),
                'created_at' => optional($message->created_at)->format('d/m/Y H:i'),
            ])
            ->values();

        return [
            ...$this->formatConversation($conversation),
            'messages' => $messages,
            'context_state' => $conversation->context_state ?? data_get($conversation->metadata, 'context_state', []),
        ];
    }

    public function close(int $id): array
    {
        $conversation = ChatConversation::query()->find($id);

        if (!$conversation) {
            throw new RuntimeException('Không tìm thấy hội thoại AI', 404);
        }

        if ($conversation->status !== 'closed') {
            $conversation->update([
                'status' => 'closed',
                'expired_at' => now(),
            ]);
        }

        $conversation->load(['summary', 'user:id,name,email']);
        $conversation->loadCount('messages');

        return $this->formatConversation($conversation);
    }

    private function formatConversation(ChatConversation $conversation): array
    {
        return [
            'id' => $conversation->id,
            'user' => $conversation->user ? [
                'id' => $conversation->user->id,
                'name' => $conversation->user->name,
                'email' => $conversation->user->email,
            ] : null,
            'guest_token' => $conversation->guest_token,
            'title' => $conversation->title,
            'status' => $conversation->status,
            'messages_count' => (int) ($conversation->messages_count ?? 0),
            'summary' => $conversation->summary?->summary,
            'last_message_at' => optional($conversation->last_message_at)->format('d/m/Y H:i'),
            'expired_at' => optional($conversation->expired_at)->format('d/m/Y H:i'),
            'created_at' => optional($conversation->created_at)->format('d/m/Y H:i'),
        ];
    }
}
