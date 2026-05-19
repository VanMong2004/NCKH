<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Notification;
use App\Models\User;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();

        if (!$user) {
            return;
        }

        Notification::query()->where('user_id', $user->id)->delete();

        Notification::insert([
            [
                'user_id' => $user->id,
                'type' => 'order',
                'title' => 'Đơn hàng đã thanh toán',
                'message' => 'Đơn hàng ORD-20260518-0006 đã thanh toán thành công.',
                'action_url' => '/profile/orders/6',
                'meta' => json_encode([
                    'order_id' => 6,
                    'order_code' => 'ORD-20260518-0006',
                ]),
                'is_read' => false,
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => $user->id,
                'type' => 'campaign',
                'title' => 'Đăng ký campaign được duyệt',
                'message' => 'Đăng ký đồng phục K2026 đã được duyệt.',
                'action_url' => '/profile/campaigns/1',
                'meta' => json_encode([
                    'campaign_id' => 1,
                ]),
                'is_read' => false,
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => $user->id,
                'type' => 'payment',
                'title' => 'Thanh toán thành công',
                'message' => 'Thanh toán PAY-000006 thành công.',
                'action_url' => '/transactions/6',
                'meta' => json_encode([
                    'payment_id' => 6,
                ]),
                'is_read' => true,
                'read_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => $user->id,
                'type' => 'system',
                'title' => 'Thông báo hệ thống',
                'message' => 'Hệ thống sẽ bảo trì lúc 22:00.',
                'action_url' => null,
                'meta' => null,
                'is_read' => false,
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}