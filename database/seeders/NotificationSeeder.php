<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        foreach (User::where('role', 'user')->get() as $user) {

            Notification::create([
                'user_id' => $user->id,
                'type' => 'order',
                'title' => 'Đơn hàng đã được tạo',
                'message' => 'Đơn hàng của bạn đã được ghi nhận và đang chờ xác nhận.',
                'icon' => 'shopping-bag',
                'color' => 'blue',
                'action_url' => '/account/orders',
                'is_read' => true,
                'read_at' => now()->subDays(5),
            ]);

            Notification::create([
                'user_id' => $user->id,
                'type' => 'payment',
                'title' => 'Thanh toán thành công',
                'message' => 'Thanh toán cho đơn hàng của bạn đã được xác nhận.',
                'icon' => 'credit-card',
                'color' => 'green',
                'action_url' => '/account/orders',
                'is_read' => false,
            ]);

            Notification::create([
                'user_id' => $user->id,
                'type' => 'system',
                'title' => 'Chào mừng đến CTUT Store',
                'message' => 'Cảm ơn bạn đã sử dụng hệ thống. Chúc bạn có trải nghiệm mua sắm vui vẻ.',
                'icon' => 'bell',
                'color' => 'indigo',
                'action_url' => '/',
                'is_read' => false,
            ]);
        }
    }
}