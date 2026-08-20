<?php

namespace Tests\Feature;

use App\Jobs\CancelPendingOrderJob;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuestCheckoutLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        cache()->flush();
        Queue::fake();
        Event::fake();
    }

    public function test_guest_can_create_first_mock_bank_order(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id)
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_method', 'mock_bank');

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('payments', 1);
        Queue::assertPushed(CancelPendingOrderJob::class);
    }

    public function test_guest_is_blocked_when_same_email_phone_has_active_mock_bank_order(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();
        $existingOrder = $this->createGuestOrder([
            'guest_token' => $guestToken,
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ], [
            'method' => 'mock_bank',
            'status' => 'unpaid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id)
        );

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'GUEST_PENDING_PAYMENT_ORDER')
            ->assertJsonPath('data.order_id', $existingOrder->id)
            ->assertJsonPath('data.order_code', $existingOrder->order_code)
            ->assertJsonPath('data.can_retry_payment', true);
    }

    public function test_guest_is_blocked_when_same_phone_but_different_email_creates_mock_bank_order(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $this->createGuestOrder([
            'guest_token' => 'other-session-token',
            'guest_email' => 'old@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ], [
            'method' => 'mock_bank',
            'status' => 'unpaid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id, [
                'guest_email' => 'new@example.com',
            ])
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'GUEST_PENDING_PAYMENT_ORDER')
            ->assertJsonPath('data.can_retry_payment', false)
            ->assertJsonMissingPath('data.order_id')
            ->assertJsonMissingPath('data.order_code');
    }

    public function test_guest_is_blocked_when_same_email_but_different_phone_creates_mock_bank_order(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $this->createGuestOrder([
            'guest_token' => 'other-session-token',
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909000000',
            'shipping_phone' => '0909000000',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ], [
            'method' => 'mock_bank',
            'status' => 'unpaid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id, [
                'guest_phone' => '0909123456',
            ])
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'GUEST_PENDING_PAYMENT_ORDER')
            ->assertJsonPath('data.can_retry_payment', false)
            ->assertJsonMissingPath('data.order_id')
            ->assertJsonMissingPath('data.order_code');
    }

    public function test_guest_can_create_new_mock_bank_order_when_old_one_completed(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $this->createGuestOrder([
            'guest_token' => $guestToken,
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'paid',
            'status' => 'completed',
            'expired_at' => now()->addMinutes(15),
        ], [
            'method' => 'mock_bank',
            'status' => 'paid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id)
        );

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('orders', 2);
    }

    public function test_guest_can_create_new_mock_bank_order_when_old_one_cancelled(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $this->createGuestOrder([
            'guest_token' => $guestToken,
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'failed',
            'status' => 'cancelled',
            'cancel_reason' => 'payment_timeout',
            'expired_at' => now()->subMinute(),
        ], [
            'method' => 'mock_bank',
            'status' => 'failed',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id)
        );

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('orders', 2);
    }

    public function test_failed_mock_bank_order_is_blocked_for_new_checkout_but_can_retry_old_payment(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();
        $order = $this->createGuestOrder([
            'guest_token' => $guestToken,
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'failed',
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ], [
            'method' => 'mock_bank',
            'status' => 'failed',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id)
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'GUEST_PENDING_PAYMENT_ORDER')
            ->assertJsonPath('data.order_id', $order->id)
            ->assertJsonPath('data.can_retry_payment', true);

        $paymentResponse = $this->withHeaders([
            'X-Guest-Token' => $guestToken,
        ])->postJson("/api/orders/{$order->id}/pay", [
            'method' => 'mock_bank',
        ]);

        $paymentResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_id', fn ($value) => is_int($value) && $value > 0)
            ->assertJsonPath('data.redirect_url', fn ($value) => is_string($value) && str_contains($value, 'method=mock_bank'));

        $this->assertDatabaseCount('payments', 2);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'failed',
        ]);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'unpaid',
        ]);
    }

    public function test_expired_mock_bank_order_is_auto_cancelled_and_does_not_block_new_checkout(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();
        $expiredOrder = $this->createGuestOrder([
            'guest_token' => $guestToken,
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'expired_at' => now()->subMinute(),
        ], [
            'method' => 'mock_bank',
            'status' => 'unpaid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id)
        );

        $response->assertOk()
            ->assertJsonPath('success', true);

        $expiredOrder->refresh();

        $this->assertSame('cancelled', $expiredOrder->status);
        $this->assertSame('payment_timeout', $expiredOrder->cancel_reason);
        $this->assertSame('failed', $expiredOrder->payment_status);
    }

    public function test_guest_can_create_first_offline_order(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id, [
                'payment_method' => 'cod',
            ])
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_method', 'cod');
    }

    public function test_guest_can_create_second_offline_order_when_only_one_active_exists(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $this->createGuestOrder([
            'guest_token' => 'cod-existing',
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'fulfillment_method' => 'delivery',
        ], [
            'method' => 'cod',
            'status' => 'unpaid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id, [
                'fulfillment_method' => 'pickup',
                'payment_method' => 'cash_on_pickup',
            ])
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_method', 'cash_on_pickup');
    }

    public function test_guest_is_blocked_when_reaching_two_active_offline_orders(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $this->createGuestOrder([
            'guest_token' => 'offline-1',
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'fulfillment_method' => 'delivery',
        ], [
            'method' => 'cod',
            'status' => 'unpaid',
        ]);

        $this->createGuestOrder([
            'guest_token' => 'offline-2',
            'guest_email' => 'other@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'unpaid',
            'status' => 'awaiting_receipt',
            'fulfillment_method' => 'pickup',
        ], [
            'method' => 'cash_on_pickup',
            'status' => 'unpaid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id, [
                'payment_method' => 'cod',
            ])
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'GUEST_ACTIVE_ORDER_LIMIT')
            ->assertJsonPath('data.can_lookup_order', true);
    }

    public function test_guest_can_create_new_offline_order_when_one_old_offline_order_is_completed(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $this->createGuestOrder([
            'guest_token' => 'offline-1',
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'fulfillment_method' => 'delivery',
        ], [
            'method' => 'cod',
            'status' => 'unpaid',
        ]);

        $this->createGuestOrder([
            'guest_token' => 'offline-2',
            'guest_email' => 'other@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'paid',
            'status' => 'completed',
            'fulfillment_method' => 'pickup',
        ], [
            'method' => 'cash_on_pickup',
            'status' => 'paid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id, [
                'payment_method' => 'cod',
            ])
        );

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_authenticated_user_is_not_limited_by_guest_order_rules(): void
    {
        $user = User::factory()->create([
            'phone' => '0909123456',
        ]);

        [$cart, $cartItem] = $this->createUserCart($user);

        $this->createGuestOrder([
            'guest_token' => 'guest-existing',
            'guest_email' => $user->email,
            'guest_phone' => $user->phone,
            'shipping_phone' => $user->phone,
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ], [
            'method' => 'mock_bank',
            'status' => 'unpaid',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/orders/checkout', [
            'guest_name' => $user->name,
            'guest_email' => $user->email,
            'guest_phone' => $user->phone,
            'province' => 'Cần Thơ',
            'district' => 'Ninh Kiều',
            'ward' => 'An Khánh',
            'address_line' => 'Khu II',
            'fulfillment_method' => 'delivery',
            'payment_method' => 'mock_bank',
            'cart_item_ids' => [$cartItem->id],
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('orders', 2);
    }

    public function test_guest_checkout_is_rate_limited_by_ip(): void
    {
        $ip = '10.10.10.10';

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $response = $this->withServerVariables([
                'REMOTE_ADDR' => $ip,
            ])->postJson('/api/orders/checkout', []);

            $response->assertStatus(422);
        }

        $blocked = $this->withServerVariables([
            'REMOTE_ADDR' => $ip,
        ])->postJson('/api/orders/checkout', []);

        $blocked->assertStatus(429)
            ->assertJsonPath('success', false);
    }

    public function test_guest_mock_bank_checkout_requires_turnstile_when_enabled(): void
    {
        config([
            'guest_checkout.turnstile_enabled' => true,
            'services.turnstile.site_key' => 'test-site-key',
            'services.turnstile.secret_key' => 'test-secret-key',
        ]);

        [$guestToken, $cartItem] = $this->createGuestCart();

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id)
        );

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.turnstile_token.0', 'Vui lòng xác minh bạn không phải là robot.');
    }

    public function test_guest_mock_bank_checkout_succeeds_with_valid_turnstile_token(): void
    {
        config([
            'guest_checkout.turnstile_enabled' => true,
            'services.turnstile.site_key' => 'test-site-key',
            'services.turnstile.secret_key' => 'test-secret-key',
        ]);

        Http::fake([
            'https://challenges.cloudflare.com/*' => Http::response([
                'success' => true,
            ], 200),
        ]);

        [$guestToken, $cartItem] = $this->createGuestCart();
        $payload = $this->guestPayload($cartItem->id);
        $payload['turnstile_token'] = 'valid-turnstile-token';

        $response = $this->postGuestCheckout($guestToken, $payload);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_method', 'mock_bank');
    }

    public function test_guest_cod_checkout_does_not_require_turnstile_when_feature_is_enabled(): void
    {
        config([
            'guest_checkout.turnstile_enabled' => true,
            'services.turnstile.site_key' => 'test-site-key',
            'services.turnstile.secret_key' => 'test-secret-key',
        ]);

        [$guestToken, $cartItem] = $this->createGuestCart();

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id, [
                'payment_method' => 'cod',
            ])
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_method', 'cod');
    }

    public function test_guest_phone_is_normalized_when_checking_existing_orders(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $this->createGuestOrder([
            'guest_token' => 'other-session-token',
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ], [
            'method' => 'mock_bank',
            'status' => 'unpaid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id, [
                'guest_phone' => '0909123456',
            ])
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'GUEST_PENDING_PAYMENT_ORDER');
    }

    public function test_guest_email_is_normalized_when_checking_existing_orders(): void
    {
        [$guestToken, $cartItem] = $this->createGuestCart();

        $this->createGuestOrder([
            'guest_token' => 'other-session-token',
            'guest_email' => 'test@gmail.com',
            'guest_phone' => '0909000000',
            'shipping_phone' => '0909000000',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ], [
            'method' => 'mock_bank',
            'status' => 'unpaid',
        ]);

        $response = $this->postGuestCheckout(
            $guestToken,
            $this->guestPayload($cartItem->id, [
                'guest_email' => 'TEST@GMAIL.COM',
                'guest_phone' => '0909123456',
            ])
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'GUEST_PENDING_PAYMENT_ORDER');
    }

    public function test_guest_can_cancel_pending_order_via_lookup_flow(): void
    {
        $guestToken = 'guest-cancel-token';
        $order = $this->createGuestOrder([
            'guest_token' => $guestToken,
            'guest_lookup_token' => 'GLK-CANCEL0001',
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ], [
            'method' => 'mock_bank',
            'status' => 'unpaid',
        ]);

        $response = $this->withHeaders([
            'X-Guest-Lookup-Token' => 'GLK-CANCEL0001',
        ])->postJson("/api/guest/orders/{$order->order_code}/cancel", []);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.cancel_reason', 'user_cancelled');

        $order->refresh();

        $this->assertSame('cancelled', $order->status);
        $this->assertSame('failed', $order->payment_status);
        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id,
            'new_status' => 'cancelled',
        ]);
    }

    public function test_guest_cannot_cancel_completed_order(): void
    {
        $guestToken = 'guest-cancel-completed-token';
        $order = $this->createGuestOrder([
            'guest_token' => $guestToken,
            'guest_lookup_token' => 'GLK-CANCEL0002',
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'payment_status' => 'paid',
            'status' => 'completed',
            'expired_at' => null,
        ], [
            'method' => 'mock_bank',
            'status' => 'paid',
        ]);

        $response = $this->withHeaders([
            'X-Guest-Lookup-Token' => 'GLK-CANCEL0002',
        ])->postJson("/api/guest/orders/{$order->order_code}/cancel", []);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);
    }

    public function test_guest_can_lookup_order_by_lookup_token_only(): void
    {
        $order = $this->createGuestOrder([
            'guest_lookup_token' => 'GLK-LOOKUP0001',
            'order_code' => 'ORD-LOOKUP-0001',
        ]);

        $response = $this->postJson('/api/guest/orders/lookup', [
            'lookup_token' => 'glk-lookup0001',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order_code', $order->order_code)
            ->assertJsonPath('data.guest_lookup_token', 'GLK-LOOKUP0001');
    }

    public function test_guest_can_lookup_order_by_phone_and_email(): void
    {
        $order = $this->createGuestOrder([
            'guest_email' => 'guest.lookup@example.com',
            'guest_phone' => '0909123456',
            'shipping_phone' => '0909123456',
            'order_code' => 'ORD-LOOKUP-PHONE',
        ]);

        $response = $this->postJson('/api/guest/orders/lookup', [
            'lookup_type' => 'phone_email',
            'phone' => '0909 123 456',
            'email' => 'GUEST.LOOKUP@EXAMPLE.COM',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order_code', $order->order_code)
            ->assertJsonPath('data.lookup_type', 'phone_email');
    }

    public function test_guest_can_lookup_order_by_order_code_and_email(): void
    {
        $order = $this->createGuestOrder([
            'guest_email' => 'guest.lookup2@example.com',
            'order_code' => 'ORD-LOOKUP-EMAIL',
        ]);

        $response = $this->postJson('/api/guest/orders/lookup', [
            'lookup_type' => 'order_code_email',
            'order_code' => 'ORD-LOOKUP-EMAIL',
            'email' => 'guest.lookup2@example.com',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order_code', $order->order_code)
            ->assertJsonPath('data.lookup_type', 'order_code_email');
    }

    public function test_guest_lookup_requires_phone_and_email_for_phone_email_mode(): void
    {
        $response = $this->postJson('/api/guest/orders/lookup', [
            'lookup_type' => 'phone_email',
            'phone' => '',
            'email' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.phone.0', 'Vui lòng nhập số điện thoại đặt hàng.')
            ->assertJsonPath('errors.email.0', 'Vui lòng nhập email đặt hàng.');
    }

    public function test_guest_lookup_requires_order_code_and_email_for_order_code_email_mode(): void
    {
        $response = $this->postJson('/api/guest/orders/lookup', [
            'lookup_type' => 'order_code_email',
            'order_code' => '',
            'email' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.order_code.0', 'Vui lòng nhập mã đơn hàng.')
            ->assertJsonPath('errors.email.0', 'Vui lòng nhập email đặt hàng.');
    }

    private function postGuestCheckout(string $guestToken, array $payload, string $ip = '127.0.0.1')
    {
        return $this->withHeaders([
            'X-Guest-Token' => $guestToken,
        ])->withServerVariables([
            'REMOTE_ADDR' => $ip,
        ])->postJson('/api/orders/checkout', $payload);
    }

    private function createGuestCart(?ProductVariant $variant = null): array
    {
        $guestToken = 'guest-' . Str::uuid();
        $variant ??= $this->createVariant();

        $cart = Cart::create([
            'guest_token' => $guestToken,
            'status' => 'active',
        ]);

        $cartItem = CartItem::create([
            'cart_id' => $cart->id,
            'product_variant_id' => $variant->id,
            'quantity' => 1,
            'is_selected' => true,
        ]);

        return [$guestToken, $cartItem, $variant];
    }

    private function createUserCart(User $user, ?ProductVariant $variant = null): array
    {
        $variant ??= $this->createVariant();

        $cart = Cart::create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $cartItem = CartItem::create([
            'cart_id' => $cart->id,
            'product_variant_id' => $variant->id,
            'quantity' => 1,
            'is_selected' => true,
        ]);

        return [$cart, $cartItem, $variant];
    }

    private function guestPayload(int $cartItemId, array $overrides = []): array
    {
        return array_merge([
            'guest_name' => 'Khách Test',
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'province' => 'Cần Thơ',
            'district' => 'Ninh Kiều',
            'ward' => 'An Khánh',
            'address_line' => 'Khu II',
            'postal_code' => '',
            'fulfillment_method' => 'delivery',
            'payment_method' => 'mock_bank',
            'cart_item_ids' => [$cartItemId],
        ], $overrides);
    }

    private function createVariant(array $overrides = []): ProductVariant
    {
        $product = Product::create([
            'name' => $overrides['product_name'] ?? ('Sản phẩm test ' . Str::random(6)),
            'slug' => $overrides['product_slug'] ?? ('san-pham-test-' . Str::lower(Str::random(8))),
            'description' => 'Mô tả test',
            'is_active' => true,
        ]);

        return ProductVariant::create([
            'product_id' => $product->id,
            'sku' => $overrides['sku'] ?? ('SKU-' . Str::upper(Str::random(8))),
            'price' => $overrides['price'] ?? 120000,
            'stock' => $overrides['stock'] ?? 20,
            'reserved_stock' => $overrides['reserved_stock'] ?? 0,
            'sold_stock' => $overrides['sold_stock'] ?? 0,
            'is_active' => $overrides['is_active'] ?? true,
            'size' => $overrides['size'] ?? 'M',
            'color' => $overrides['color'] ?? 'Xanh',
        ]);
    }

    private function createGuestOrder(array $orderOverrides = [], array $paymentOverrides = []): Order
    {
        $order = Order::create(array_merge([
            'user_id' => null,
            'guest_token' => 'guest-order-' . Str::uuid(),
            'guest_lookup_token' => 'GLK-' . Str::upper(Str::random(10)),
            'guest_name' => 'Khách Test',
            'guest_email' => 'guest@example.com',
            'guest_phone' => '0909123456',
            'fulfillment_method' => 'delivery',
            'shipping_name' => 'Khách Test',
            'shipping_phone' => '0909123456',
            'shipping_address' => 'Khu II, An Khánh, Ninh Kiều, Cần Thơ',
            'sub_total' => 120000,
            'discount_total' => 0,
            'grand_total' => 120000,
            'total' => 120000,
            'shipping_fee' => 0,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'expired_at' => now()->addMinutes(15),
            'cancel_reason' => null,
            'order_code' => 'ORD-TEST-' . Str::upper(Str::random(8)),
        ], $orderOverrides));

        Payment::create(array_merge([
            'order_id' => $order->id,
            'method' => 'mock_bank',
            'status' => 'unpaid',
            'amount' => $order->total,
            'transaction_id' => (string) Str::uuid(),
            'meta' => null,
            'response_data' => null,
        ], $paymentOverrides));

        return $order->fresh('payments');
    }
}
