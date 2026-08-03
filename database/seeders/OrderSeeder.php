<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\PromotionItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    private const PICKUP_ADDRESS = 'Phòng Công tác Chính trị & Quản lý sinh viên Trường Đại học Kỹ thuật - Công nghệ Cần Thơ';

    public function run(): void
    {
        $orders = [
            [
                'email' => 'nhat.b2200001@ctuet.edu.vn',
                'status' => 'completed',
                'fulfillment_method' => 'delivery',
                'payment_status' => 'paid',
                'shipping_address' => 'Ký túc xá CTUT, khu A, An Khánh, Ninh Kiều, Cần Thơ',
                'items' => [
                    ['Áo thun CTUT K2026', 'L', 'Trắng', 2],
                    ['Ly giữ nhiệt CTUT', null, null, 1],
                ],
            ],
            [
                'email' => 'anh.b2200102@ctuet.edu.vn',
                'status' => 'completed',
                'fulfillment_method' => 'pickup',
                'payment_status' => 'paid',
                'items' => [
                    ['Hoodie CTUT Premium', 'XL', 'Đen', 1],
                    ['Sticker CTUT', null, null, 2],
                ],
            ],
            [
                'email' => 'bao.b2300221@ctuet.edu.vn',
                'status' => 'completed',
                'fulfillment_method' => 'delivery',
                'payment_status' => 'paid',
                'shipping_address' => 'Khu dân cư Hưng Phú, Hưng Phú, Cái Răng, Cần Thơ',
                'items' => [
                    ['Áo khoa CNTT', 'M', 'Đen', 1],
                    ['Bảng tên sinh viên CTUT', null, null, 1],
                    ['Dây đeo thẻ CTUT', null, 'Xanh CTUT', 1],
                ],
            ],
            [
                'email' => 'vy.b2400305@ctuet.edu.vn',
                'status' => 'completed',
                'fulfillment_method' => 'pickup',
                'payment_status' => 'paid',
                'items' => [
                    ['Áo Freshman Week 2026', 'S', 'Trắng', 1],
                    ['Túi tote CTUT', null, null, 1],
                ],
            ],
            [
                'email' => 'han.b2500411@ctuet.edu.vn',
                'status' => 'completed',
                'fulfillment_method' => 'delivery',
                'payment_status' => 'paid',
                'shipping_address' => 'Đường Võ Văn Kiệt, Long Hòa, Bình Thủy, Cần Thơ',
                'items' => [
                    ['Áo khoa Cơ khí', 'L', 'Xám', 1],
                    ['Móc khóa CTUT', null, null, 2],
                ],
            ],
            [
                'email' => 'nam.b2300440@ctuet.edu.vn',
                'status' => 'completed',
                'fulfillment_method' => 'delivery',
                'payment_status' => 'paid',
                'shipping_address' => 'Đường Mậu Thân, Hưng Lợi, Ninh Kiều, Cần Thơ',
                'items' => [
                    ['Áo khoa Điện - Điện tử', 'M', 'Trắng', 1],
                    ['Nón lưỡi trai CTUT', null, 'Đen', 1],
                ],
            ],
            [
                'email' => 'nhat.b2200001@ctuet.edu.vn',
                'status' => 'awaiting_receipt',
                'fulfillment_method' => 'delivery',
                'payment_status' => 'paid',
                'shipping_address' => 'Ký túc xá CTUT, khu A, An Khánh, Ninh Kiều, Cần Thơ',
                'items' => [
                    ['Sổ tay CTUT', 'A5', null, 2],
                    ['Bút CTUT', null, 'Mực xanh', 3],
                ],
            ],
            [
                'email' => 'anh.b2200102@ctuet.edu.vn',
                'status' => 'processing',
                'fulfillment_method' => 'pickup',
                'payment_status' => 'paid',
                'items' => [
                    ['Ly giữ nhiệt CTUT', null, null, 1],
                ],
            ],
            [
                'email' => 'bao.b2300221@ctuet.edu.vn',
                'status' => 'awaiting_receipt',
                'fulfillment_method' => 'pickup',
                'payment_status' => 'paid',
                'items' => [
                    ['Túi tote CTUT', null, null, 1],
                    ['Sticker CTUT', null, null, 1],
                ],
            ],
            [
                'email' => 'vy.b2400305@ctuet.edu.vn',
                'status' => 'pending',
                'fulfillment_method' => 'delivery',
                'payment_status' => 'unpaid',
                'shipping_address' => 'Hẻm 51 đường 3/2, An Bình, Ninh Kiều, Cần Thơ',
                'items' => [
                    ['Áo thun CTUT K2026', 'M', 'Xanh CTUT', 1],
                ],
            ],
            [
                'email' => 'han.b2500411@ctuet.edu.vn',
                'status' => 'cancelled',
                'fulfillment_method' => 'delivery',
                'payment_status' => 'failed',
                'shipping_address' => 'Đường Võ Văn Kiệt, Long Hòa, Bình Thủy, Cần Thơ',
                'items' => [
                    ['Hoodie CTUT Premium', 'M', 'Xám', 1],
                ],
                'cancel_reason' => 'Hết hạn thanh toán',
            ],
            [
                'email' => 'user@example.com',
                'status' => 'pending',
                'fulfillment_method' => 'pickup',
                'payment_status' => 'unpaid',
                'items' => [
                    ['Bút CTUT', null, 'Mực đen', 2],
                    ['Sổ tay CTUT', 'B5', null, 1],
                ],
            ],
        ];

        foreach ($orders as $index => $data) {
            $user = User::where('email', $data['email'])->first();

            if (!$user) {
                continue;
            }

            $orderCode = 'ORD-2026-' . str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT);

            $order = Order::firstOrCreate([
                'order_code' => $orderCode,
            ], [
                'user_id' => $user->id,
                'guest_token' => null,
                'guest_name' => null,
                'guest_email' => null,
                'guest_phone' => null,
                'fulfillment_method' => $data['fulfillment_method'],
                'shipping_name' => $user->name,
                'shipping_phone' => $user->phone,
                'shipping_address' => $data['fulfillment_method'] === 'pickup'
                    ? self::PICKUP_ADDRESS
                    : ($data['shipping_address'] ?? 'Ký túc xá CTUT, Ninh Kiều, Cần Thơ'),
                'sub_total' => 0,
                'discount_total' => 0,
                'grand_total' => 0,
                'total' => 0,
                'shipping_fee' => 0,
                'status' => $data['status'],
                'payment_status' => $data['payment_status'],
                'expired_at' => $data['payment_status'] === 'unpaid' ? now()->addMinutes(15) : null,
                'cancel_reason' => $data['cancel_reason'] ?? null,
            ]);

            if (!$order->wasRecentlyCreated) {
                continue;
            }

            $subTotal = 0;
            $discountTotal = 0;

            foreach ($data['items'] as [$productName, $size, $color, $quantity]) {
                $variant = ProductVariant::whereHas('product', fn ($query) => $query->where('name', $productName))
                    ->when($size, fn ($query) => $query->where('size', $size))
                    ->when($color, fn ($query) => $query->where('color', $color))
                    ->first();

                if (!$variant) {
                    continue;
                }

                $promotionItem = $this->findPromotionItem($variant);
                $discount = $promotionItem ? $this->discountAmount((float) $variant->price, $promotionItem) : 0;
                $finalPrice = max(0, (float) $variant->price - $discount);

                $subTotal += (float) $variant->price * $quantity;
                $discountTotal += $discount * $quantity;

                OrderItem::updateOrCreate([
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                ], [
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'price' => $variant->price,
                    'quantity' => $quantity,
                    'product_name' => $variant->product->name,
                    'variant_snapshot' => [
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'attributes' => $variant->attributes,
                        'sku' => $variant->sku,
                    ],
                    'original_price' => $variant->price,
                    'discount_amount' => $discount,
                    'final_price' => $finalPrice,
                    'promotion_id' => $promotionItem?->promotion_id,
                    'promotion_snapshot' => $promotionItem ? [
                        'promotion_id' => $promotionItem->promotion_id,
                        'discount_type' => $promotionItem->discount_type,
                        'discount_value' => $promotionItem->discount_value,
                    ] : null,
                ]);

                if (in_array($data['status'], ['pending', 'processing', 'awaiting_receipt'], true)) {
                    $variant->increment('reserved_stock', $quantity);
                }

                if ($data['status'] === 'completed') {
                    $variant->increment('sold_stock', $quantity);
                }
            }

            $shippingFee = $data['fulfillment_method'] === 'pickup' ? 0 : 35000;

            $order->update([
                'sub_total' => $subTotal,
                'discount_total' => $discountTotal,
                'grand_total' => $subTotal - $discountTotal,
                'shipping_fee' => $shippingFee,
                'total' => $subTotal - $discountTotal + $shippingFee,
            ]);
        }
    }

    private function findPromotionItem(ProductVariant $variant): ?PromotionItem
    {
        return PromotionItem::where('is_active', true)
            ->where('product_id', $variant->product_id)
            ->whereHas('promotion', function ($query) {
                $query->where('is_active', true)
                    ->where('status', 'active')
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now());
            })
            ->where(function ($query) use ($variant) {
                $query->where('variant_unique_key', 0)
                    ->orWhere('variant_unique_key', $variant->id);
            })
            ->first();
    }

    private function discountAmount(float $price, PromotionItem $promotionItem): float
    {
        if ($promotionItem->discount_type === 'percent') {
            return round($price * (float) $promotionItem->discount_value / 100, 2);
        }

        return min($price, (float) $promotionItem->discount_value);
    }
}
