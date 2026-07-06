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
    public function run(): void
    {
        $orders = [
            [
                'email' => 'nhat.b2200001@ctuet.edu.vn',
                'status' => 'completed',
                'items' => [
                    ['Áo thun CTUT K2026', 'L', 'Trắng', 2],
                    ['Ly giữ nhiệt CTUT', null, null, 1],
                ],
            ],
            [
                'email' => 'anh.b2200102@ctuet.edu.vn',
                'status' => 'completed',
                'items' => [
                    ['Hoodie CTUT Premium', 'XL', 'Đen', 1],
                    ['Sticker CTUT', null, null, 2],
                ],
            ],
            [
                'email' => 'bao.b2300221@ctuet.edu.vn',
                'status' => 'completed',
                'items' => [
                    ['Áo khoa CNTT', 'M', 'Đen', 1],
                    ['Bảng tên sinh viên CTUT', null, null, 1],
                    ['Dây đeo thẻ CTUT', null, 'Xanh CTUT', 1],
                ],
            ],
            [
                'email' => 'vy.b2400305@ctuet.edu.vn',
                'status' => 'completed',
                'items' => [
                    ['Áo Freshman Week 2026', 'S', 'Trắng', 1],
                    ['Túi tote CTUT', null, null, 1],
                ],
            ],
            [
                'email' => 'han.b2500411@ctuet.edu.vn',
                'status' => 'completed',
                'items' => [
                    ['Áo khoa Cơ khí', 'L', 'Xám', 1],
                    ['Móc khóa CTUT', null, null, 2],
                ],
            ],
            [
                'email' => 'nam.b2300440@ctuet.edu.vn',
                'status' => 'completed',
                'items' => [
                    ['Áo khoa Điện - Điện tử', 'M', 'Trắng', 1],
                    ['Nón lưỡi trai CTUT', null, 'Đen', 1],
                ],
            ],
            ['email' => 'nhat.b2200001@ctuet.edu.vn', 'status' => 'shipped', 'items' => [['Sổ tay CTUT', 'A5', null, 2], ['Bút CTUT', null, 'Mực xanh', 3]]],
            ['email' => 'anh.b2200102@ctuet.edu.vn', 'status' => 'paid', 'items' => [['Ly giữ nhiệt CTUT', null, null, 1]]],
            ['email' => 'bao.b2300221@ctuet.edu.vn', 'status' => 'completed', 'items' => [['Túi tote CTUT', null, null, 1], ['Sticker CTUT', null, null, 1]]],
            ['email' => 'vy.b2400305@ctuet.edu.vn', 'status' => 'pending', 'items' => [['Áo thun CTUT K2026', 'M', 'Xanh CTUT', 1]]],
            ['email' => 'han.b2500411@ctuet.edu.vn', 'status' => 'cancelled', 'items' => [['Hoodie CTUT Premium', 'M', 'Xám', 1]]],
        ];

        foreach ($orders as $index => $data) {
            $user = User::where('email', $data['email'])->first();

            if (!$user) {
                continue;
            }

            $orderCode = 'ORD-2026-' . str_pad($index + 1, 5, '0', STR_PAD_LEFT);

            $order = Order::firstOrCreate([
                'order_code' => $orderCode,
            ], [
                'user_id' => $user->id,
                'guest_token' => null,
                'guest_name' => null,
                'guest_email' => null,
                'guest_phone' => null,
                'shipping_name' => $user->name,
                'shipping_phone' => $user->phone,
                'shipping_address' => 'Ký túc xá CTUT, Ninh Kiều, Cần Thơ',
                'sub_total' => 0,
                'discount_total' => 0,
                'grand_total' => 0,
                'total' => 0,
                'shipping_fee' => 0,
                'status' => $data['status'],
                'expired_at' => $data['status'] === 'pending' ? now()->addMinutes(15) : null,
                'cancel_reason' => $data['status'] === 'cancelled' ? 'Khách hàng không thanh toán đúng hạn' : null,
                'order_code' => $orderCode,
            ]);

            if (!$order->wasRecentlyCreated) {
                continue;
            }

            $subTotal = 0;
            $discountTotal = 0;

            foreach ($data['items'] as [$productName, $size, $color, $quantity]) {
                $variant = ProductVariant::whereHas('product', fn ($q) => $q->where('name', $productName))
                    ->when($size, fn ($q) => $q->where('size', $size))
                    ->when($color, fn ($q) => $q->where('color', $color))
                    ->first();

                if (!$variant) {
                    continue;
                }

                $promotionItem = $this->findPromotionItem($variant);
                $discount = $promotionItem ? $this->discountAmount($variant->price, $promotionItem) : 0;
                $finalPrice = max(0, $variant->price - $discount);

                $subTotal += $variant->price * $quantity;
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

                if (in_array($data['status'], ['pending', 'paid', 'processing', 'shipped'], true)) {
                    $variant->increment('reserved_stock', $quantity);
                }

                if ($data['status'] === 'completed') {
                    $variant->increment('sold_stock', $quantity);
                }
            }

            $shippingFee = $subTotal >= 300000 ? 0 : 30000;

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
            return round($price * $promotionItem->discount_value / 100, 2);
        }

        return min($price, $promotionItem->discount_value);
    }
}
