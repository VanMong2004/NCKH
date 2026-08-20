<?php

namespace App\Services;

use App\Jobs\CancelPendingOrderJob;
use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\PromotionItem;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class OrderService
{
    public function __construct(
        protected PromotionPriceService $promotionPriceService,
        protected GuestCheckoutGuardService $guestCheckoutGuardService
    ) {}

    public function checkout($user, ?string $guestToken, array $data)
    {
        if (!$user && !$guestToken) {
            throw new RuntimeException('Thiếu mã giỏ hàng khách', 400);
        }

        $data = $this->normalizeCheckoutData($data);
        $autoCancelMinutes = $this->getOrderAutoCancelMinutes();
        $fulfillmentMethod = $data['fulfillment_method'];
        $paymentMethod = $data['payment_method'];

        $this->validateCheckoutCombination(
            $fulfillmentMethod,
            $paymentMethod
        );

        $executeCheckout = function () use (
            $user,
            $guestToken,
            $data,
            $autoCancelMinutes,
            $fulfillmentMethod,
            $paymentMethod
        ) {
            return DB::transaction(function () use (
                $user,
                $guestToken,
                $data,
                $autoCancelMinutes,
                $fulfillmentMethod,
                $paymentMethod
            ) {
                if (!$user) {
                    $this->guestCheckoutGuardService->assertCanCheckout($data, $guestToken);
                }

                $cartQuery = Cart::with([
                    'items' => function ($query) use ($data) {
                        $query->whereIn('id', $data['cart_item_ids']);
                    },
                    'items.productVariant.product',
                ])->where('status', 'active');

                if ($user) {
                    $cartQuery->where('user_id', $user->id);
                } else {
                    $cartQuery->where('guest_token', $guestToken);
                }

                $cart = $cartQuery
                    ->lockForUpdate()
                    ->first();

                if (!$cart) {
                    throw new RuntimeException('Giỏ hàng trống', 400);
                }

                $selectedItems = $cart->items;

                if ($selectedItems->isEmpty()) {
                    throw new RuntimeException(
                        'Không có sản phẩm nào được chọn',
                        400
                    );
                }

                foreach ($selectedItems as $item) {
                    $variant = ProductVariant::with('product')
                        ->lockForUpdate()
                        ->find($item->product_variant_id);

                    if (!$variant) {
                        throw new RuntimeException('Biến thể sản phẩm không tồn tại', 404);
                    }

                    if (!$variant->is_active || !$variant->product?->is_active) {
                        throw new RuntimeException('Sản phẩm hiện không còn được mở bán', 400);
                    }

                    $available = $variant->stock - $variant->reserved_stock;

                    if ($available < $item->quantity) {
                        $productName = $variant->product?->name ?? 'Sản phẩm';

                        throw new RuntimeException(
                            "Sản phẩm {$productName} không đủ hàng",
                            400
                        );
                    }
                }

                $shipping = $this->resolveShippingInfo($user, $data, $fulfillmentMethod);

                $order = Order::create([
                    'user_id' => $user?->id,
                    'guest_token' => $user ? null : $guestToken,
                    'guest_lookup_token' => $user ? null : $this->generateGuestLookupToken(),
                    'guest_name' => $shipping['guest_name'],
                    'guest_email' => $shipping['guest_email'],
                    'guest_phone' => $shipping['guest_phone'],
                    'fulfillment_method' => $fulfillmentMethod,
                    'order_code' => 'TEMP-' . uniqid(),
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'expired_at' => $paymentMethod === 'mock_bank'
                        ? now()->addMinutes($autoCancelMinutes)
                        : null,
                    'total' => 0,
                    'shipping_fee' => $fulfillmentMethod === 'delivery' ? 35000 : 0,
                    'shipping_name' => $shipping['name'],
                    'shipping_phone' => $shipping['phone'],
                    'shipping_address' => $shipping['address'],
                ]);

                $order->update([
                    'order_code' => $this->generateOrderCode($order->id),
                ]);

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'changed_by' => $user?->id,
                    'old_status' => null,
                    'new_status' => 'pending',
                    'note' => 'Đơn hàng được tạo từ đặt hàng.',
                ]);

                if ($order->user_id) {
                    app(NotificationService::class)
                        ->order($order, 'pending');
                }

                $total = 0;
                $totalDiscount = 0;

                foreach ($selectedItems as $item) {
                    $variant = ProductVariant::with('product')
                        ->lockForUpdate()
                        ->find($item->product_variant_id);

                    if (!$variant) {
                        throw new RuntimeException('Biến thể sản phẩm không tồn tại', 404);
                    }

                    if (!$variant->is_active || !$variant->product?->is_active) {
                        throw new RuntimeException('Sản phẩm hiện không còn được mở bán', 400);
                    }

                    $before = clone $variant;
                    $variant->increment('reserved_stock', $item->quantity);
                    $after = $variant->fresh();

                    app(\App\Services\Admin\InventoryHistoryService::class)->record(
                        $before,
                        $after,
                        'checkout_reserve',
                        (int) $item->quantity,
                        $order->id,
                        $user?->id,
                        'Checkout giữ hàng'
                    );

                    $priceData = $this->promotionPriceService
                        ->calculateForVariant(
                            $variant,
                            $user,
                            (int) $item->quantity
                        );

                    $originalPrice = $priceData['original_price'];
                    $discountAmount = $priceData['discount_amount'];
                    $finalPrice = $priceData['final_price'];

                    $promotionId = $user
                        ? ($priceData['promotion']['id'] ?? null)
                        : null;

                    $promotionItemId = $user
                        ? ($priceData['promotion']['promotion_item_id'] ?? null)
                        : null;

                    $promotionSnapshot = $user
                        ? ($priceData['promotion'] ?? null)
                        : null;

                    if ($promotionItemId) {
                        $promotionItem = PromotionItem::with('promotion')
                            ->lockForUpdate()
                            ->find($promotionItemId);

                        if (
                            !$promotionItem
                            || !$promotionItem->is_active
                            || !$promotionItem->promotion
                            || !$promotionItem->promotion->isRunning()
                        ) {
                            throw new RuntimeException('Khuyến mãi không còn hiệu lực', 400);
                        }

                        if (!is_null($promotionItem->limit_quantity)) {
                            $remaining = $promotionItem->limit_quantity
                                - $promotionItem->sold_quantity
                                - $promotionItem->reserved_quantity;

                            if ($remaining < $item->quantity) {
                                throw new RuntimeException('Khuyến mãi không đủ lượt áp dụng', 400);
                            }
                        }

                        $promotionItem->increment(
                            'reserved_quantity',
                            $item->quantity
                        );
                    }

                    $lineTotal = $finalPrice * $item->quantity;
                    $totalDiscount += $discountAmount * $item->quantity;

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_variant_id' => $variant->id,
                        'price' => $finalPrice,
                        'original_price' => $originalPrice,
                        'discount_amount' => $discountAmount,
                        'final_price' => $finalPrice,
                        'quantity' => $item->quantity,
                        'product_name' => $variant->product?->name ?? 'Sản phẩm',
                        'variant_snapshot' => [
                            'sku' => $variant->sku,
                            'size' => $variant->size,
                            'color' => $variant->color,
                            'attributes' => $variant->attributes ?? [],
                        ],
                        'promotion_id' => $promotionId,
                        'promotion_snapshot' => $promotionSnapshot,
                    ]);

                    $total += $lineTotal;
                }

                $order->update([
                    'sub_total' => $total + $totalDiscount,
                    'discount_total' => $totalDiscount,
                    'grand_total' => $total + (float) $order->shipping_fee,
                    'total' => $total + (float) $order->shipping_fee,
                ]);

                $order->refresh();

                Payment::create([
                    'order_id' => $order->id,
                    'method' => $paymentMethod,
                    'status' => 'unpaid',
                    'amount' => $order->total,
                    'transaction_id' => in_array($paymentMethod, ['cod', 'cash_on_pickup'], true)
                        ? null
                        : Str::uuid(),
                ]);

                event(new \App\Events\OrderCreated($order));
                app(\App\Services\Analytics\AnalyticsEventService::class)
                    ->broadcastDashboardRefresh();

                CartItem::whereIn('id', $selectedItems->pluck('id'))->delete();

                return $order;
            });
        };

        $order = $user
            ? $executeCheckout()
            : $this->guestCheckoutGuardService->withGuestLock(
                $data['guest_email'] ?? null,
                $data['guest_phone'] ?? null,
                $executeCheckout
            );

        if ($paymentMethod === 'mock_bank') {
            try {
                CancelPendingOrderJob::dispatch($order->id)
                    ->delay($order->expired_at ?? now()->addMinutes($autoCancelMinutes));
            } catch (\Throwable $e) {
                Log::error('Dispatch cancel pending order job failed', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (in_array($paymentMethod, ['cod', 'cash_on_pickup'], true)) {
            try {
                app(OrderEmailWebhookService::class)->sendCodOrderCreated($order);
            } catch (\Throwable $e) {
                Log::error('Send COD order email webhook failed', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $order->load('items.productVariant.product');
        $items = $order->items;
        $subTotal = $items->sum(fn ($item) => $item->original_price * $item->quantity);
        $shippingFee = $order->shipping_fee ?? 0;

        return [
            'user_id' => $order->user_id,
            'guestToken' => $order->guest_token,
            'guestLookupToken' => $order->guest_lookup_token,
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'fulfillment_method' => $order->fulfillment_method,
            'sub_total' => $subTotal,
            'shipping_fee' => $shippingFee,
            'discount' => $order->discount_total,
            'grand_total' => $order->total,
            'payment_method' => $paymentMethod,
            'items' => $items->map(fn ($item) => [
                'product_name' => $item->product_name,
                'thumbnail' => $item->productVariant?->product?->thumbnail,
                'original_price' => $item->original_price,
                'discount_amount' => $item->discount_amount,
                'final_price' => $item->final_price,
                'quantity' => $item->quantity,
                'total' => $item->final_price * $item->quantity,
                'promotion' => $item->promotion_id
                    ? $item->promotion_snapshot
                    : null,
                'promotion_login_required' => !$order->user_id
                    && !empty($item->promotion_snapshot),
            ]),
        ];
    }

    private function generateOrderCode(int $orderId): string
    {
        return 'ORD-'
            . now()->format('Ymd')
            . '-'
            . str_pad($orderId, 6, '0', STR_PAD_LEFT);
    }

    private function generateGuestLookupToken(): string
    {
        do {
            $token = 'GLK-' . Str::upper(Str::random(10));
        } while (Order::query()->where('guest_lookup_token', $token)->exists());

        return $token;
    }

    private function resolveShippingInfo($user, array $data, string $fulfillmentMethod): array
    {
        if ($user) {
            if (!empty($data['address_id'])) {
                if ($fulfillmentMethod !== 'delivery') {
                    throw new RuntimeException('Không thể dùng địa chỉ giao hàng cho hình thức nhận tại phòng', 422);
                }

                $address = Address::query()
                    ->where('user_id', $user->id)
                    ->whereKey($data['address_id'])
                    ->first();

                if (!$address) {
                    throw new RuntimeException('Địa chỉ giao hàng không tồn tại', 404);
                }

                return [
                    'name' => $address->full_name,
                    'phone' => $this->guestCheckoutGuardService->normalizePhone($address->phone),
                    'address' => $this->formatAddress([
                        $address->address_line,
                        $address->ward,
                        $address->district,
                        $address->province,
                    ]),
                    'guest_name' => null,
                    'guest_email' => null,
                    'guest_phone' => null,
                ];
            }

            $this->validateInlineAddress($data, false, $fulfillmentMethod);

            $canSaveAddress = $fulfillmentMethod === 'delivery'
                && !empty($data['province'])
                && !empty($data['district'])
                && !empty($data['ward'])
                && !empty($data['address_line']);

            if (!empty($data['save_address']) && $canSaveAddress) {
                $hasAddress = Address::query()
                    ->where('user_id', $user->id)
                    ->exists();

                $isDefault = !$hasAddress || !empty($data['is_default']);

                if ($isDefault) {
                    Address::query()
                        ->where('user_id', $user->id)
                        ->update(['is_default' => false]);
                }

                Address::create([
                    'user_id' => $user->id,
                    'full_name' => trim((string) $data['guest_name']),
                    'phone' => $data['guest_phone'],
                    'province' => $data['province'] ?? null,
                    'district' => $data['district'] ?? null,
                    'ward' => $data['ward'] ?? null,
                    'address_line' => $data['address_line'] ?? null,
                    'postal_code' => $data['postal_code'] ?? null,
                    'is_default' => $isDefault,
                ]);
            }

            return [
                'name' => trim((string) $data['guest_name']),
                'phone' => $data['guest_phone'],
                'address' => $this->resolveFulfillmentAddress($data, $fulfillmentMethod),
                'guest_name' => null,
                'guest_email' => null,
                'guest_phone' => null,
            ];
        }

        $this->validateInlineAddress($data, true, $fulfillmentMethod);

        return [
            'name' => trim((string) $data['guest_name']),
            'phone' => $data['guest_phone'],
            'address' => $this->resolveFulfillmentAddress($data, $fulfillmentMethod),
            'guest_name' => trim((string) $data['guest_name']),
            'guest_email' => $data['guest_email'] ?? null,
            'guest_phone' => $data['guest_phone'],
        ];
    }

    private function validateInlineAddress(
        array $data,
        bool $requireEmail,
        string $fulfillmentMethod
    ): void {
        if (empty($data['guest_name'])) {
            throw new RuntimeException('Vui lòng nhập tên người nhận', 422);
        }

        if ($requireEmail && empty($data['guest_email'])) {
            throw new RuntimeException('Vui lòng nhập email', 422);
        }

        if (!empty($data['guest_email']) && !filter_var($data['guest_email'], FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Email không đúng định dạng', 422);
        }

        if (empty($data['guest_phone'])) {
            throw new RuntimeException('Vui lòng nhập số điện thoại người nhận', 422);
        }

        if (!preg_match('/^0\d{9}$/', (string) $data['guest_phone'])) {
            throw new RuntimeException('Số điện thoại phải gồm 10 số và bắt đầu bằng số 0', 422);
        }

        if ($fulfillmentMethod === 'delivery') {
            foreach (['province', 'district', 'ward', 'address_line'] as $field) {
                if (empty($data[$field])) {
                    throw new RuntimeException('Vui lòng nhập đầy đủ thông tin địa chỉ giao hàng', 422);
                }
            }
        }
    }

    private function resolveFulfillmentAddress(array $data, string $fulfillmentMethod): string
    {
        if ($fulfillmentMethod === 'pickup') {
            return 'Phòng Công tác chính trị - Sinh viên - Khởi nghiệp';
        }

        return $this->formatAddress([
            $data['address_line'] ?? null,
            $data['ward'] ?? null,
            $data['district'] ?? null,
            $data['province'] ?? null,
        ]);
    }

    private function validateCheckoutCombination(
        string $fulfillmentMethod,
        string $paymentMethod
    ): void {
        $validCombinations = [
            'delivery:cod',
            'delivery:mock_bank',
            'pickup:cash_on_pickup',
            'pickup:mock_bank',
        ];

        if (!in_array("{$fulfillmentMethod}:{$paymentMethod}", $validCombinations, true)) {
            throw new RuntimeException('Tổ hợp nhận hàng và thanh toán không hợp lệ', 422);
        }
    }

    private function formatAddress(array $parts): string
    {
        return collect($parts)
            ->map(fn ($part) => is_string($part) ? trim($part) : $part)
            ->filter()
            ->implode(', ');
    }

    private function getOrderAutoCancelMinutes(): int
    {
        return (int) (
            SystemSetting::query()
                ->value('order_auto_cancel_minutes')
            ?? 15
        );
    }

    private function normalizeCheckoutData(array $data): array
    {
        if (array_key_exists('guest_email', $data)) {
            $data['guest_email'] = $this->guestCheckoutGuardService->normalizeEmail($data['guest_email']);
        }

        if (array_key_exists('guest_phone', $data)) {
            $data['guest_phone'] = $this->guestCheckoutGuardService->normalizePhone($data['guest_phone']);
        }

        return $data;
    }
}
