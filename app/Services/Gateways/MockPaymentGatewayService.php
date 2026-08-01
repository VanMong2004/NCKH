<?php

namespace App\Services\Gateways;

use App\Events\OrderPaid;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Services\Analytics\AnalyticsEventService;
use App\Services\Admin\OrderReleaseService;
use App\Services\NotificationService;
use App\Services\OrderEmailWebhookService;
use App\Services\PromotionSoldService;
use Illuminate\Support\Facades\DB;

class MockPaymentGatewayService
{
    public function __construct(
        protected PromotionSoldService $promotionSoldService,
    ) {}

    public function create(Payment $payment): array
    {
        return [
            'payment_id' => $payment->id,
            'transaction_id' => $payment->transaction_id,
            'redirect_url' => url("/api/payment/callback?payment_id={$payment->id}&status=success&method=mock_bank"),
        ];
    }

    public function callback(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $payment = Payment::lockForUpdate()->findOrFail($data['payment_id']);

            if ($payment->status !== 'unpaid') {
                return [
                    'message' => 'Payment Ä‘Ã£ xá»­ lÃ½',
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'order_code' => $payment->order?->order_code,
                    'status' => $payment->status,
                ];
            }

            $order = Order::lockForUpdate()->findOrFail($payment->order_id);

            if (
                $order->status === 'pending'
                && $order->expired_at
                && now()->greaterThan($order->expired_at)
            ) {
                app(OrderReleaseService::class)
                    ->release($order->load('items.productVariant'));

                $payment->update([
                    'status' => 'failed',
                    'response_data' => $data,
                ]);

                $oldStatus = $order->status;

                $order->update([
                    'status' => 'cancelled',
                    'cancel_reason' => 'payment_timeout',
                    'payment_status' => 'failed',
                ]);

                $this->createStatusHistory(
                    $order,
                    $oldStatus,
                    'cancelled',
                    'ÄÆ¡n hÃ ng háº¿t háº¡n thanh toÃ¡n'
                );

                app(NotificationService::class)->order($order->fresh(), 'cancelled');
                app(AnalyticsEventService::class)->broadcastDashboardRefresh();

                return [
                    'message' => 'ÄÆ¡n hÃ ng Ä‘Ã£ háº¿t háº¡n thanh toÃ¡n',
                    'payment_id' => $payment->id,
                    'order_id' => $order->id,
                    'order_code' => $order->order_code,
                    'status' => 'failed',
                ];
            }

            if ($order->status === 'cancelled') {
                $payment->update([
                    'status' => 'failed',
                    'response_data' => $data,
                ]);

                app(AnalyticsEventService::class)->broadcastDashboardRefresh();

                return [
                    'message' => 'ÄÆ¡n hÃ ng Ä‘Ã£ bá»‹ há»§y, khÃ´ng thá»ƒ thanh toÃ¡n',
                    'payment_id' => $payment->id,
                    'order_id' => $order->id,
                    'order_code' => $order->order_code,
                    'status' => 'failed',
                ];
            }

            $status = ($data['status'] ?? '') === 'success' ? 'paid' : 'failed';

            $payment->update([
                'status' => $status,
                'response_data' => $data,
            ]);

            if ($status === 'paid') {
                $oldStatus = $order->status;
                $alreadyPaid = $order->payment_status === 'paid';

                $order->update([
                    'payment_status' => 'paid',
                    'status' => $order->status === 'pending' ? 'processing' : $order->status,
                    'cancel_reason' => null,
                ]);

                if ($oldStatus !== $order->status) {
                    $this->createStatusHistory(
                        $order,
                        $oldStatus,
                        $order->status,
                        'Thanh toÃ¡n giáº£ láº­p ngÃ¢n hÃ ng thÃ nh cÃ´ng'
                    );
                }

                app(NotificationService::class)->order($order->fresh(), $order->status);
                $order->load('items.productVariant');

                Payment::query()
                    ->where('order_id', $order->id)
                    ->where('id', '!=', $payment->id)
                    ->where('status', 'unpaid')
                    ->update([
                        'status' => 'failed',
                        'response_data' => [
                            'reason' => 'superseded_by_successful_payment',
                            'paid_payment_id' => $payment->id,
                        ],
                    ]);

                if (!$alreadyPaid) {
                    $this->promotionSoldService->increase($order);
                }

                try {
                    app(OrderEmailWebhookService::class)->sendPaymentSuccess($order, $payment);
                } catch (\Throwable $e) {
                }

                event(new OrderPaid($order));
            } else {
                $order->update([
                    'payment_status' => 'failed',
                    'cancel_reason' => null,
                ]);

                app(AnalyticsEventService::class)->broadcastDashboardRefresh();
            }

            return [
                'message' => 'Callback xá»­ lÃ½ thÃ nh cÃ´ng',
                'payment_id' => $payment->id,
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'status' => $status,
            ];
        });
    }

    private function createStatusHistory(
        Order $order,
        ?string $oldStatus,
        string $newStatus,
        ?string $note = null
    ): void {
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'changed_by' => null,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'note' => $note,
        ]);
    }
}
