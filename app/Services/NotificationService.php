<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Order;
use App\Events\NotificationCreated;
use RuntimeException;

class NotificationService
{
    public function list($user, array $filters = [])
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        $perPage = min($filters['per_page'] ?? 10, 50);

        $query = Notification::query()
            ->where('user_id', $user->id)
            ->latest();

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['is_read'])) {
            $query->where(
                'is_read',
                filter_var($filters['is_read'], FILTER_VALIDATE_BOOLEAN)
            );
        }

        $notifications = $query->paginate($perPage);

        $notifications->setCollection(
            $notifications->getCollection()->map(
                fn ($item) => $this->format($item)
            )
        );

        return $notifications;
    }

    public function show($user, $id)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $notification = Notification::where('user_id', $user->id)
            ->find($id);

        if (!$notification) {
            throw new RuntimeException('Thông báo không tồn tại', 404);
        }

        return $this->format($notification);
    }

    public function unreadCount($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        return Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();
    }

    public function markRead($user, $id)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $notification = Notification::where('user_id', $user->id)
            ->find($id);

        if (!$notification) {
            throw new RuntimeException('Thông báo không tồn tại', 404);
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return $this->format($notification->fresh());
    }

    public function markAllRead($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return true;
    }

    public function createForUser(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        ?array $meta = null,
        ?string $icon = null,
        ?string $color = null
    ) {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'icon' => $icon,
            'color' => $color,
            'action_url' => $actionUrl,
            'meta' => $meta,
            'is_read' => false,
        ]);

        broadcast(new NotificationCreated(
            $notification,
            $this->format($notification)
        ));

        return $notification;
    }

    public function order(Order $order, string $status): ?Notification
    {
        if (!$order->user_id) {
            return null;
        }

        $awaitingReceiptTitle = $order->fulfillment_method === 'pickup'
            ? 'Đơn hàng sẵn sàng nhận tại phòng'
            : 'Đơn hàng đang giao';

        $awaitingReceiptMessage = $order->fulfillment_method === 'pickup'
            ? "Đơn hàng {$order->order_code} đã sẵn sàng để bạn nhận tại Phòng Công tác chính trị - Sinh viên - Khởi nghiệp."
            : "Đơn hàng {$order->order_code} đang được giao đến bạn.";

        $map = [
            'pending' => [
                'type' => 'order',
                'title' => 'Đặt hàng thành công',
                'message' => "Đơn hàng {$order->order_code} đã được ghi nhận.",
                'icon' => 'shopping-bag',
                'color' => 'blue',
            ],

            'paid' => [
                'type' => 'payment',
                'title' => 'Thanh toán thành công',
                'message' => "Đơn hàng {$order->order_code} đã được thanh toán thành công.",
                'icon' => 'credit-card',
                'color' => 'green',
            ],

            'processing' => [
                'type' => 'order',
                'title' => 'Đơn hàng đang được xử lý',
                'message' => "Đơn hàng {$order->order_code} đang được chuẩn bị.",
                'icon' => 'package',
                'color' => 'amber',
            ],

            'awaiting_receipt' => [
                'type' => 'order',
                'title' => $awaitingReceiptTitle,
                'message' => $awaitingReceiptMessage,
                'icon' => 'truck',
                'color' => 'indigo',
            ],

            'completed' => [
                'type' => 'order',
                'title' => 'Đơn hàng hoàn tất',
                'message' => "Đơn hàng {$order->order_code} đã hoàn tất. Cảm ơn bạn đã mua hàng tại CTUT UniShop.",
                'icon' => 'circle-check',
                'color' => 'emerald',
            ],

            'cancelled' => [
                'type' => 'order',
                'title' => 'Đơn hàng đã hủy',
                'message' => "Đơn hàng {$order->order_code} đã bị hủy.",
                'icon' => 'circle-x',
                'color' => 'red',
            ],
        ];

        if (!isset($map[$status])) {
            return null;
        }

        $item = $map[$status];

        return $this->createForUser(
            $order->user_id,
            $item['type'],
            $item['title'],
            $item['message'],
            "/account/orders/{$order->id}",
            [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'status' => $status,
            ],
            $item['icon'],
            $item['color']
        );
    }

    private function format($notification)
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'icon' => $notification->icon,
            'color' => $notification->color,
            'action_url' => $notification->action_url,
            'meta' => $notification->meta,
            'is_read' => (bool) $notification->is_read,
            'read_at' => optional($notification->read_at)->format('d/m/Y H:i'),
            'created_at' => optional($notification->created_at)->format('d/m/Y H:i'),
            'time_ago' => optional($notification->created_at)
                ? $notification->created_at->diffForHumans()
                : '',
        ];
    }

    // public function order(
    //     Order $order,
    //     string $status
    // ): void
    // {
    //     if (!$order->user_id) {
    //         return;
    //     }

    //     $messages = [

    //         'pending' => [
    //             'title' => 'Đặt hàng thành công',
    //             'message' => "Đơn hàng {$order->order_code} đã được tạo thành công.",
    //         ],

    //         'paid' => [
    //             'title' => 'Thanh toán thành công',
    //             'message' => "Đơn hàng {$order->order_code} đã được thanh toán.",
    //         ],

    //         'processing' => [
    //             'title' => 'Đơn hàng đang được xử lý',
    //             'message' => "Đơn hàng {$order->order_code} đang được chuẩn bị.",
    //         ],

    //         'shipped' => [
    //             'title' => 'Đơn hàng đang giao',
    //             'message' => "Đơn hàng {$order->order_code} đang được giao.",
    //         ],

    //         'completed' => [
    //             'title' => 'Hoàn thành đơn hàng',
    //             'message' => "Cảm ơn bạn đã mua hàng tại CTUT UniShop.",
    //         ],

    //         'cancelled' => [
    //             'title' => 'Đơn hàng đã hủy',
    //             'message' => "Đơn hàng {$order->order_code} đã bị hủy.",
    //         ],

    //     ];

    //     if (!isset($messages[$status])) {
    //         return;
    //     }

    //     $item = $messages[$status];

    //     Notification::create([
    //         'user_id' => $order->user_id,

    //         'type' => 'order',

    //         'title' => $item['title'],

    //         'message' => $item['message'],

    //         'action_url' => "/account/orders/{$order->id}",

    //         'meta' => [
    //             'order_id' => $order->id,
    //             'order_code' => $order->order_code,
    //             'status' => $status,
    //         ],
    //     ]);
    // }
}