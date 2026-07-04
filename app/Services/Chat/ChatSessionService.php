<?php

namespace App\Services\Chat;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class ChatSessionService
{
    private const DEFAULT_EXPIRE_DAYS = 7;
    private const DEFAULT_HISTORY_LIMIT = 20;

    public function currentSession($user, ?string $guestToken = null, ?string $title = null): ChatConversation
    {
        $guestToken = $this->normalizeGuestToken($user, $guestToken);
        $this->expireInactiveSessions($user, $guestToken);

        $conversation = $this->ownerQuery($user, $guestToken)
            ->where('status', 'active')
            ->latest('last_message_at')
            ->latest()
            ->first();

        if ($conversation) {
            return $conversation;
        }

        return ChatConversation::create([
            'user_id' => $user?->id,
            'guest_token' => $user ? null : $guestToken,
            'title' => $title ? Str::limit($title, 80) : 'Hội thoại AI',
            'status' => 'active',
            'last_message_at' => now(),
        ]);
    }

    public function findOwnedSession($user, ?string $guestToken, int $conversationId): ChatConversation
    {
        $guestToken = $this->normalizeGuestToken($user, $guestToken);
        $this->expireInactiveSessions($user, $guestToken);

        $conversation = $this->ownerQuery($user, $guestToken)
            ->where('status', 'active')
            ->find($conversationId);

        if (!$conversation) {
            throw new RuntimeException('Không tìm thấy hội thoại', 404);
        }

        return $conversation;
    }

    public function resetSession($user, ?string $guestToken = null): ChatConversation
    {
        $guestToken = $this->normalizeGuestToken($user, $guestToken);

        return DB::transaction(function () use ($user, $guestToken) {
            $this->ownerQuery($user, $guestToken)
                ->where('status', 'active')
                ->update([
                    'status' => 'closed',
                    'expired_at' => now(),
                ]);

            return ChatConversation::create([
                'user_id' => $user?->id,
                'guest_token' => $user ? null : $guestToken,
                'title' => 'Hội thoại AI',
                'status' => 'active',
                'last_message_at' => now(),
            ]);
        });
    }

    public function recentMessages(ChatConversation $conversation, int $limit = self::DEFAULT_HISTORY_LIMIT)
    {
        $limit = max(1, min($limit, 50));

        return ChatMessage::query()
            ->select(['id', 'conversation_id', 'parent_message_id', 'role', 'content', 'metadata', 'created_at'])
            ->where('conversation_id', $conversation->id)
            ->whereIn('role', ['user', 'assistant'])
            ->latest('id')
            ->limit($limit)
            ->get()
            ->sortBy('id')
            ->values();
    }

    public function formatSession(ChatConversation $conversation): array
    {
        return [
            'id' => $conversation->id,
            'title' => $conversation->title,
            'status' => $conversation->status,
            'guest_token' => $conversation->guest_token,
            'last_message_at' => optional($conversation->last_message_at)->format('d/m/Y H:i'),
            'expired_at' => optional($conversation->expired_at)->format('d/m/Y H:i'),
        ];
    }

    public function formatMessages($messages)
    {
        return $messages
            ->map(fn ($message) => [
                'id' => $message->id,
                'parent_message_id' => $message->parent_message_id,
                'role' => $message->role,
                'content' => $message->content,
                'sources' => $message->sources ?? [],
                'tool_calls' => $message->tool_calls ?? [],
                'products' => data_get($message->metadata, 'products', []),
                'promotions' => data_get($message->metadata, 'promotions', []),
                'created_at' => optional($message->created_at)->format('d/m/Y H:i'),
            ])
            ->values();
    }

    public function touchSession(ChatConversation $conversation): void
    {
        $conversation->update([
            'status' => 'active',
            'last_message_at' => now(),
            'expired_at' => null,
        ]);
    }

    public function normalizeGuestToken($user, ?string $guestToken): string
    {
        if ($user) {
            return '';
        }

        $guestToken = trim((string) $guestToken);

        return $guestToken !== '' ? $guestToken : (string) Str::uuid();
    }

    private function expireInactiveSessions($user, string $guestToken): void
    {
        $expiredBefore = now()->subDays((int) config('services.openai.chat_session_expire_days', self::DEFAULT_EXPIRE_DAYS));

        $this->ownerQuery($user, $guestToken)
            ->where('status', 'active')
            ->whereNotNull('last_message_at')
            ->where('last_message_at', '<', $expiredBefore)
            ->update([
                'status' => 'expired',
                'expired_at' => now(),
            ]);
    }

    private function ownerQuery($user, string $guestToken): Builder
    {
        $query = ChatConversation::query();

        if ($user) {
            return $query->where('user_id', $user->id);
        }

        return $query->where('guest_token', $guestToken);
    }
}
