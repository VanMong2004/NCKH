<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Analytics\AnalyticsEventService;
use App\Services\Gateways\MockPaymentGatewayService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class PaymentService
{
    public function __construct(
        protected MockPaymentGatewayService $mockGateway
    ) {}

    public function pay($user, ?string $guestToken, ?string $guestLookupToken, int $orderId, string $method)
    {
        if (!$user && !$guestToken && !$guestLookupToken) {
            throw new RuntimeException('Thiếu mã đơn hàng khách', 400);
        }

        return DB::transaction(function () use ($user, $guestToken, $guestLookupToken, $orderId, $method) {
            $orderQuery = Order::lockForUpdate()
                ->whereIn('status', ['pending', 'processing']);

            if ($user) {
                $orderQuery->where('user_id', $user->id);
            } else {
                $orderQuery->where(function ($query) use ($guestToken, $guestLookupToken) {
                    if (!empty($guestToken)) {
                        $query->orWhere('guest_token', $guestToken);
                    }

                    if (!empty($guestLookupToken)) {
                        $query->orWhere('guest_lookup_token', app(GuestCheckoutGuardService::class)->normalizeLookupToken($guestLookupToken));
                    }
                });
            }

            $order = $orderQuery->find($orderId);

            if (!$order) {
                throw new RuntimeException('Đơn hàng không tồn tại', 404);
            }

            $this->validatePaymentMethodForOrder($order, $method);

            if ($order->payment_status === 'paid') {
                throw new RuntimeException('Đơn hàng đã được thanh toán', 409);
            }

            if ($order->expired_at && now()->greaterThan($order->expired_at)) {
                app(OrderExpirationService::class)
                    ->expireIfNeeded($order, $user?->id);

                throw new RuntimeException('Đơn hàng đã hết hạn thanh toán', 400);
            }

            if ($method !== 'mock_bank') {
                throw new RuntimeException('Phương thức này không hỗ trợ tạo thanh toán mới cho đơn hàng', 422);
            }

            $pendingPayment = Payment::query()
                ->where('order_id', $order->id)
                ->where('method', 'mock_bank')
                ->where('status', 'unpaid')
                ->latest('id')
                ->first();

            if ($pendingPayment) {
                return $this->resolveGateway($pendingPayment);
            }

            $payment = Payment::create([
                'order_id' => $order->id,
                'method' => $method,
                'status' => 'unpaid',
                'amount' => $order->total,
                'transaction_id' => (string) Str::uuid(),
                'meta' => [
                    'retry' => true,
                    'attempted_at' => now()->toIso8601String(),
                ],
            ]);

            if ($order->status === 'pending') {
                $order->update([
                    'expired_at' => now()->addMinutes($this->getOrderAutoCancelMinutes()),
                    'payment_status' => 'unpaid',
                ]);
            }

            return $this->resolveGateway($payment);
        });
    }

    protected function resolveGateway(Payment $payment): array
    {
        return match ($payment->method) {
            'mock_bank' => $this->mockGateway->create($payment),
            'cod', 'cash_on_pickup' => $this->buildOfflinePaymentResponse($payment),
            default => throw new RuntimeException('Phương thức thanh toán không được hỗ trợ', 400),
        };
    }

    public function handleCallback(array $data)
    {
        $method = $data['method'] ?? 'mock_bank';

        return match ($method) {
            'mock_bank' => $this->mockGateway->callback($data),
            default => throw new RuntimeException('Callback không hợp lệ', 400),
        };
    }

    public function markOfflinePaymentAsPaid(Order $order, ?string $note = null): void
    {
        $payment = $order->payments()
            ->latest()
            ->first();

        if (!$payment || $payment->status === 'paid') {
            return;
        }

        $payment->update([
            'status' => 'paid',
            'response_data' => [
                'note' => $note,
                'confirmed_at' => now()->toIso8601String(),
            ],
        ]);

        $order->update([
            'payment_status' => 'paid',
        ]);
    }

    private function buildOfflinePaymentResponse(Payment $payment): array
    {
        $payment->load('order');

        return [
            'payment_id' => $payment->id,
            'order_id' => $payment->order_id,
            'order_code' => $payment->order->order_code,
            'method' => $payment->method,
            'status' => $payment->status,
            'need_callback' => false,
            'amount' => (float) $payment->amount,
            'redirect_url' => null,
            'message' => 'Đơn hàng đã được tạo thành công.',
        ];
    }

    private function validatePaymentMethodForOrder(Order $order, string $method): void
    {
        $fulfillmentMethod = $order->fulfillment_method ?? 'delivery';
        $validCombinations = [
            'delivery' => ['cod', 'mock_bank'],
            'pickup' => ['cash_on_pickup', 'mock_bank'],
        ];

        if (!in_array($method, $validCombinations[$fulfillmentMethod] ?? [], true)) {
            throw new RuntimeException('Phương thức thanh toán không phù hợp với hình thức nhận hàng', 422);
        }
    }

    private function getOrderAutoCancelMinutes(): int
    {
        return (int) (
            \App\Models\SystemSetting::query()
                ->value('order_auto_cancel_minutes')
            ?? 15
        );
    }
}
