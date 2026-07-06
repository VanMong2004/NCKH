<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        foreach (User::where('role', 'user')->get() as $user) {
            $latestOrder = Order::query()
                ->where('user_id', $user->id)
                ->latest('id')
                ->first();

            $latestPaidOrder = Order::query()
                ->where('user_id', $user->id)
                ->whereHas('payments', function ($query) {
                    $query->where('status', 'success');
                })
                ->latest('id')
                ->first();

            if ($latestOrder) {
                Notification::updateOrCreate([
                    'user_id' => $user->id,
                    'type' => 'order',
                    'action_url' => "/account/orders/{$latestOrder->id}",
                ], [
                    'user_id' => $user->id,
                    'type' => 'order',
                    'title' => 'Đơn hàng đã được tạo',
                    'message' => "Đơn hàng {$latestOrder->order_code} đã được ghi nhận.",
                    'icon' => 'shopping-bag',
                    'color' => 'blue',
                    'action_url' => "/account/orders/{$latestOrder->id}",
                    'meta' => [
                        'order_id' => $latestOrder->id,
                        'order_code' => $latestOrder->order_code,
                        'status' => $latestOrder->status,
                    ],
                    'is_read' => true,
                    'read_at' => now()->subDays(5),
                ]);
            }

            if ($latestPaidOrder) {
                Notification::updateOrCreate([
                    'user_id' => $user->id,
                    'type' => 'payment',
                    'action_url' => "/account/orders/{$latestPaidOrder->id}",
                ], [
                    'user_id' => $user->id,
                    'type' => 'payment',
                    'title' => 'Thanh toán thành công',
                    'message' => "Thanh toán cho đơn hàng {$latestPaidOrder->order_code} đã được xác nhận.",
                    'icon' => 'credit-card',
                    'color' => 'green',
                    'action_url' => "/account/orders/{$latestPaidOrder->id}",
                    'meta' => [
                        'order_id' => $latestPaidOrder->id,
                        'order_code' => $latestPaidOrder->order_code,
                        'status' => $latestPaidOrder->status,
                    ],
                    'is_read' => false,
                ]);
            }

            Notification::updateOrCreate([
                'user_id' => $user->id,
                'type' => 'system',
                'action_url' => '/',
            ], [
                'user_id' => $user->id,
                'type' => 'system',
                'title' => 'Chào mừng đến CTUT Store',
                'message' => 'Cảm ơn bạn đã sử dụng hệ thống. Chúc bạn có trải nghiệm mua sắm vui vẻ.',
                'icon' => 'bell',
                'color' => 'slate',
                'action_url' => '/',
                'is_read' => false,
            ]);
        }
    }
}
