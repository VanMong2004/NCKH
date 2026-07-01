<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Services\Admin\OrderReleaseService;
use App\Services\Analytics\AnalyticsEventService;
use App\Services\NotificationService;
use App\Services\WebhookService;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class CancelPendingOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $orderId;

    public function __construct($orderId)
    {
        $this->orderId = (int) $orderId;
    }

    public function handle(): void
    {
        DB::transaction(function () {

            $order = Order::with([
                'items.productVariant',
            ])
                ->lockForUpdate()
                ->find($this->orderId);

            if (!$order) {
                return;
            }

            if ($order->status !== 'pending') {
                return;
            }

            if ($order->expired_at && now()->lt($order->expired_at)) {
                return;
            }

            app(OrderReleaseService::class)
                ->release($order);

            $oldStatus = $order->status;

            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => 'payment_timeout',
            ]);

            $order->payments()
                ->where('status', 'pending')
                ->update([
                    'status' => 'failed',
                    'response_data' => [
                        'reason' => 'payment_timeout',
                    ],
                ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'changed_by' => null,
                'old_status' => $oldStatus,
                'new_status' => 'cancelled',
                'note' => 'Tự động hủy đơn do hết hạn thanh toán',
            ]);

            if ($order->user_id) {
                app(NotificationService::class)
                    ->order($order->fresh(), 'cancelled');
            }

            app(WebhookService::class)->send('order_cancelled', [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'reason' => $order->cancel_reason,
            ]);

            app(AnalyticsEventService::class)
                ->broadcastDashboardRefresh();

            Log::info('Auto cancel order', [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
            ]);
        });
    }
}
