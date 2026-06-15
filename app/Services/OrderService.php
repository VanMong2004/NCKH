<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Address;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Exception;
use App\Jobs\CancelPendingOrderJob;
use App\Services\PromotionPriceService;

class OrderService
{
    public function __construct(
        protected PromotionPriceService $promotionPriceService
    ) {}
    // =========================
    // CHECKOUT
    // =========================
    public function checkout($user, ?string $guestToken, array $data)
    {
        if (!$user && !$guestToken) {
            throw new RuntimeException('Thiếu mã giỏ hàng khách', 400);
        }

        $order = DB::transaction(function () use ($user, $guestToken, $data) {
            $cartQuery = Cart::with([
                'items' => function ($query) use ($data) {
                    $query->whereIn('id', $data['cart_item_ids']);
                },
                'items.productVariant.product',
            ])
            ->where('status', 'active');

            if ($user) {
                $cartQuery->where('user_id', $user->id);
            } else {
                $cartQuery->where('guest_token', $guestToken);
            }

            $cart = $cartQuery->first();

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

                $available = $variant->stock - $variant->reserved_stock;

                if ($available < $item->quantity) {
                    $productName = $variant->product?->name ?? 'Sản phẩm';

                    throw new RuntimeException(
                        "Sản phẩm {$productName} không đủ hàng",
                        400
                    );
                }
            }

            $shipping = $this->resolveShippingInfo(
                $user,
                $data
            );

            $order = Order::create([
                'user_id' => $user?->id,
                'guest_token' => $user ? null : $guestToken,

                'guest_name' => $shipping['guest_name'],
                'guest_email' => $shipping['guest_email'],
                'guest_phone' => $shipping['guest_phone'],

                'type' => 'normal',
                'order_code' => $this->generateOrderCode(),
                'status' => 'pending',

                'total' => 0,
                'shipping_fee' => 0,

                'shipping_name' => $shipping['name'],
                'shipping_phone' => $shipping['phone'],
                'shipping_address' => $shipping['address'],
            ]);

            $total = 0;
            $totalDiscount = 0;

            foreach ($selectedItems as $item) {
                $variant = ProductVariant::with('product')
                    ->lockForUpdate()
                    ->find($item->product_variant_id);

                if (!$variant) {
                    throw new RuntimeException('Biến thể sản phẩm không tồn tại', 404);
                }

                $variant->increment(
                    'reserved_stock',
                    $item->quantity
                );

                $priceData = $this->promotionPriceService
                    ->calculateForVariant(
                        $variant,
                        $user
                    );

                $originalPrice = $priceData['original_price'];

                $discountAmount = $priceData['discount_amount'];

                $finalPrice = $priceData['final_price'];

                $lineTotal = $finalPrice * $item->quantity;

                $totalDiscount += (
                    $discountAmount
                    *
                    $item->quantity
                );

                OrderItem::create([
                    'order_id' => $order->id,

                    'product_variant_id' => $variant->id,

                    // giữ tương thích code cũ
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

                    'promotion_id' => $user
                        ? ($priceData['promotion']['id'] ?? null)
                        : null,

                    'promotion_snapshot' => $user
                        ? ($priceData['promotion'] ?? null)
                        : null,
                ]);

                $total += $lineTotal;
            }

            $order->update([
                'sub_total' => $total + $totalDiscount,

                'discount_total' => $totalDiscount,

                'grand_total' => $total,

                'total' => $total,
            ]);

            $order->refresh();

            event(new \App\Events\OrderCreated($order));

            // $cart->update([
            //     'status' => 'checked_out',
            // ]);
            CartItem::whereIn(
                'id',
                $selectedItems->pluck('id')
            )->delete();

            return $order;
        });

        CancelPendingOrderJob::dispatch($order->id)
            ->delay(
                now()->addMinutes(
                    config('app.order_auto_cancel_minutes')
                )
            );

        $order->load('items');

        $items = $order->items;

        $subTotal = $items->sum(
            fn ($item) =>
                $item->original_price * $item->quantity
        );

        $shippingFee = $order->shipping_fee ?? 0;

        $paymentMethod = $data['payment_method'] ?? 'mock';

        return [
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'status' => $order->status,

            'sub_total' => $subTotal,
            'shipping_fee' => $shippingFee,
            'discount' => $order->discount_total,
            'grand_total' => $order->total,

            'payment_method' => $paymentMethod,

            'items' => $items->map(fn ($item) => [
                'product_name' => $item->product_name,

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

    // =========================
    // GENERATE ORDER CODE
    // =========================
    private function generateOrderCode()
    {
        $date = now()->format('Ymd');

        $count = Order::whereDate('created_at', now())->count() + 1;

        return 'ORD-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    // =========================
    // RESOLVE SHIPPING INFO
    // =========================
    private function resolveShippingInfo($user, array $data): array
    {
        /*
        |--------------------------------------------------------------------------
        | User đăng nhập
        |--------------------------------------------------------------------------
        */
        if ($user) {

            if (empty($data['address_id'])) {
                throw new RuntimeException(
                    'Vui lòng chọn địa chỉ giao hàng',
                    422
                );
            }

            $address = Address::query()
                ->where('user_id', $user->id)
                ->whereKey($data['address_id'])
                ->first();

            if (!$address) {
                throw new RuntimeException(
                    'Địa chỉ giao hàng không tồn tại',
                    404
                );
            }

            return [
                'name' => $address->full_name,

                'phone' => $address->phone,

                'address' => implode(', ', [
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

        /*
        |--------------------------------------------------------------------------
        | Guest checkout
        |--------------------------------------------------------------------------
        */
        if (empty($data['guest_name'])) {
            throw new RuntimeException(
                'Vui lòng nhập tên người nhận',
                422
            );
        }

        if (empty($data['guest_email'])) {
            throw new RuntimeException(
                'Vui lòng nhập email',
                422
            );
        }

        if (!filter_var($data['guest_email'], FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException(
                'Email không đúng định dạng',
                422
            );
        }

        if (empty($data['guest_phone'])) {
            throw new RuntimeException(
                'Vui lòng nhập số điện thoại người nhận',
                422
            );
        }

        if (empty($data['address_line'])) {
            throw new RuntimeException(
                'Vui lòng nhập địa chỉ giao hàng',
                422
            );
        }

        if (empty($data['ward'])) {
            throw new RuntimeException(
                'Vui lòng chọn phường/xã',
                422
            );
        }

        if (empty($data['district'])) {
            throw new RuntimeException(
                'Vui lòng chọn quận/huyện',
                422
            );
        }

        if (empty($data['province'])) {
            throw new RuntimeException(
                'Vui lòng chọn tỉnh/thành phố',
                422
            );
        }

        return [
            'name' => $data['guest_name'],

            'phone' => $data['guest_phone'],

            'address' => implode(', ', [
                $data['address_line'],
                $data['ward'],
                $data['district'],
                $data['province'],
            ]),

            'guest_name' => $data['guest_name'],

            'guest_email' => $data['guest_email'],

            'guest_phone' => $data['guest_phone'],
        ];
    }
}