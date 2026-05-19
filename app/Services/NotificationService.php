<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    public function list($user, array $filters = [])
    {
        $perPage = min($filters['per_page'] ?? 10, 50);

        $query = Notification::query()
            ->where('user_id', $user->id)
            ->latest();

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['is_read'])) {
            $query->where('is_read', filter_var($filters['is_read'], FILTER_VALIDATE_BOOLEAN));
        }

        $notifications = $query->paginate($perPage);

        $notifications->setCollection(
            $notifications->getCollection()->map(fn ($item) => $this->format($item))
        );

        return $notifications;
    }

    public function show($user, $id)
    {
        $notification = Notification::where('user_id', $user->id)
            ->findOrFail($id);

        return $this->format($notification);
    }

    public function unreadCount($user)
    {
        return Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();
    }

    public function markRead($user, $id)
    {
        $notification = Notification::where('user_id', $user->id)
            ->findOrFail($id);

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return $this->format($notification->fresh());
    }

    public function markAllRead($user)
    {
        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return true;
    }

    public function createForUser($userId, string $type, string $title, string $message, ?string $actionUrl = null, ?array $meta = null)
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'meta' => $meta,
            'is_read' => false,
        ]);
    }

    private function format($notification)
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'action_url' => $notification->action_url,
            'meta' => $notification->meta,
            'is_read' => (bool) $notification->is_read,
            'read_at' => optional($notification->read_at)->format('d/m/Y H:i'),
            'created_at' => optional($notification->created_at)->format('d/m/Y H:i'),
        ];
    }
}