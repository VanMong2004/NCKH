<?php

namespace App\Services;

use App\Exceptions\GuestCheckoutLimitException;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class GuestCheckoutGuardService
{
    public function normalizeEmail(?string $email): string
    {
        return strtolower(trim((string) $email));
    }

    public function normalizePhone(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        if (str_starts_with($digits, '84') && strlen($digits) === 11) {
            $digits = '0' . substr($digits, 2);
        }

        if (str_starts_with($digits, '840') && strlen($digits) === 12) {
            $digits = '0' . substr($digits, 3);
        }

        return substr($digits, 0, 10);
    }

    public function withGuestLock(?string $email, ?string $phone, callable $callback): mixed
    {
        $keys = collect([
            $this->buildLockKey('email', $this->normalizeEmail($email)),
            $this->buildLockKey('phone', $this->normalizePhone($phone)),
        ])
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return $this->runLockChain($keys, 0, $callback);
    }

    public function assertCanCheckout(array $data, ?string $guestToken = null): void
    {
        $email = $this->normalizeEmail($data['guest_email'] ?? null);
        $phone = $this->normalizePhone($data['guest_phone'] ?? null);
        $paymentMethod = (string) ($data['payment_method'] ?? '');

        if ($email === '' && $phone === '') {
            return;
        }

        $activeOrders = $this->loadActiveGuestOrders($email, $phone);
        $this->expireStalePendingOrders($activeOrders);
        $activeOrders = $this->loadActiveGuestOrders($email, $phone);

        if ($paymentMethod === 'mock_bank') {
            $blockingOrder = $this->findBlockingMockBankOrder($activeOrders);

            if (!$blockingOrder) {
                return;
            }

            throw new GuestCheckoutLimitException(
                'Bạn đang có một đơn hàng chưa hoàn tất thanh toán. Vui lòng hoàn tất đơn hiện tại trước khi tạo đơn mới.',
                'GUEST_PENDING_PAYMENT_ORDER',
                $this->buildPendingPaymentPayload($blockingOrder, $email, $phone, $guestToken),
                409
            );
        }

        if (!in_array($paymentMethod, ['cod', 'cash_on_pickup'], true)) {
            return;
        }

        $activeOfflineOrders = $this->findActiveOfflineOrders($activeOrders);

        if ($activeOfflineOrders->count() < (int) config('guest_checkout.max_active_offline_orders', 2)) {
            return;
        }

        throw new GuestCheckoutLimitException(
            'Bạn đang có 2 đơn hàng chưa hoàn thành. Vui lòng hoàn tất hoặc hủy các đơn hiện tại trước khi tạo thêm đơn hàng mới.',
            'GUEST_ACTIVE_ORDER_LIMIT',
            [
                'can_lookup_order' => true,
            ],
            409
        );
    }

    protected function activeGuestOrdersQuery(string $email, string $phone): Builder
    {
        return Order::query()
            ->with(['payments' => fn ($query) => $query->latest('id')])
            ->whereNull('user_id')
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->where(function (Builder $query) use ($email, $phone) {
                if ($phone !== '') {
                    $query->orWhere('guest_phone', $phone)
                        ->orWhere('shipping_phone', $phone);
                }

                if ($email !== '') {
                    $query->orWhereRaw('LOWER(TRIM(guest_email)) = ?', [$email]);
                }
            });
    }

    protected function loadActiveGuestOrders(string $email, string $phone): Collection
    {
        return $this->activeGuestOrdersQuery($email, $phone)
            ->lockForUpdate()
            ->get();
    }

    protected function expireStalePendingOrders(Collection $orders): void
    {
        $orders
            ->filter(
                fn (Order $order) => $order->status === 'pending'
                    && $order->expired_at
                    && now()->greaterThan($order->expired_at)
            )
            ->each(fn (Order $order) => app(OrderExpirationService::class)->expireIfNeeded($order));
    }

    protected function findBlockingMockBankOrder(Collection $orders): ?Order
    {
        return $orders->first(function (Order $order) {
            if (in_array($order->status, ['cancelled', 'completed'], true)) {
                return false;
            }

            if ($order->expired_at && now()->greaterThan($order->expired_at)) {
                return false;
            }

            if (!in_array($order->payment_status, ['unpaid', 'failed'], true)) {
                return false;
            }

            return $order->payments->contains(
                fn ($payment) => $payment->method === 'mock_bank'
            );
        });
    }

    protected function findActiveOfflineOrders(Collection $orders): Collection
    {
        return $orders
            ->filter(function (Order $order) {
                if (!in_array($order->status, ['pending', 'processing', 'awaiting_receipt'], true)) {
                    return false;
                }

                return $order->payments->contains(
                    fn ($payment) => in_array($payment->method, ['cod', 'cash_on_pickup'], true)
                );
            })
            ->values();
    }

    protected function buildPendingPaymentPayload(
        Order $order,
        string $email,
        string $phone,
        ?string $guestToken
    ): array {
        $latestPayment = $order->payments
            ->sortByDesc('id')
            ->first(fn ($payment) => $payment->method === 'mock_bank');

        $emailMatches = $email !== ''
            && $this->normalizeEmail($order->guest_email) === $email;

        $phoneMatches = $phone !== ''
            && $this->normalizePhone($order->guest_phone ?: $order->shipping_phone) === $phone;

        $sameGuestSession = $guestToken
            && $order->guest_token
            && hash_equals($order->guest_token, $guestToken);

        $canResume = $emailMatches
            && $phoneMatches
            && $sameGuestSession
            && $order->status === 'pending'
            && in_array($order->payment_status, ['unpaid', 'failed'], true);

        if (!$canResume) {
            return [
                'can_lookup_order' => true,
                'can_retry_payment' => false,
            ];
        }

        return [
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'payment_status' => $order->payment_status,
            'payment_method' => 'mock_bank',
            'can_retry_payment' => true,
            'can_lookup_order' => true,
            'guest_token' => $order->guest_token,
            'expired_at' => optional($order->expired_at)->toIso8601String(),
            'payment_id' => $latestPayment?->id,
        ];
    }

    protected function buildLockKey(string $prefix, string $value): ?string
    {
        if ($value === '') {
            return null;
        }

        return 'guest-checkout:' . $prefix . ':' . sha1($value);
    }

    protected function runLockChain(Collection $keys, int $index, callable $callback): mixed
    {
        if (!isset($keys[$index])) {
            return $callback();
        }

        $seconds = (int) config('guest_checkout.lock_seconds', 10);

        return Cache::lock($keys[$index], $seconds)->block($seconds, function () use ($keys, $index, $callback) {
            return $this->runLockChain($keys, $index + 1, $callback);
        });
    }
}
