<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Services\Admin\OrderReleaseService;
use App\Services\Analytics\AnalyticsEventService;
use Illuminate\Support\Facades\DB;

class OrderExpirationService
{
    public function expireIfNeeded(Order $order, ?int $changedBy = null): Order
    {
        return DB::transaction(function () use ($order, $changedBy) {
            $lockedOrder = Order::with([
                'items.productVariant',
                'payments',
                'statusHistories',
            ])
                ->lockForUpdate()
                ->find($order->id);

            if (!$lockedOrder) {
                return $order;
            }

            if ($lockedOrder->status !== 'pending') {
                return $lockedOrder;
            }

            if (!$lockedOrder->expired_at || now()->lt($lockedOrder->expired_at)) {
                return $lockedOrder;
            }

            app(OrderReleaseService::class)
                ->release($lockedOrder);

            $oldStatus = $lockedOrder->status;

            $lockedOrder->payments()
                ->where('status', 'unpaid')
                ->update([
                    'status' => 'failed',
                    'response_data' => [
                        'reason' => 'payment_timeout',
                    ],
                ]);

            $lockedOrder->update([
                'status' => 'cancelled',
                'cancel_reason' => 'payment_timeout',
                'payment_status' => 'failed',
            ]);

            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'changed_by' => $changedBy,
                'old_status' => $oldStatus,
                'new_status' => 'cancelled',
                'note' => 'Đơn hàng tự động hủy do hết hạn thanh toán',
            ]);

            if ($lockedOrder->user_id) {
                app(NotificationService::class)
                    ->order($lockedOrder->fresh(), 'cancelled');
            }

            app(WebhookService::class)->send('order_cancelled', [
                'order_id' => $lockedOrder->id,
                'order_code' => $lockedOrder->order_code,
                'reason' => 'payment_timeout',
            ]);

            app(AnalyticsEventService::class)
                ->broadcastDashboardRefresh();

            return $lockedOrder->fresh([
                'items.productVariant',
                'payments',
                'statusHistories',
            ]);
        });
    }
}
