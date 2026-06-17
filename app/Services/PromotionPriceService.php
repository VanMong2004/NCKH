<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\PromotionItem;

class PromotionPriceService
{
    public function calculateForVariant(ProductVariant $variant, $user = null, int $quantity = 1): array
    {
        $originalPrice = (float) $variant->price;

        $promotionItem = $this->findActivePromotionItem($variant, $quantity);

        if (!$promotionItem) {

            return [
                'original_price' => $originalPrice,
                'discount_amount' => 0,
                'final_price' => $originalPrice,

                'promotion_price' => null,
                'promotion' => null,

                'has_promotion' => false,
                'promotion_login_required' => false,
            ];
        }

        $discountType = $promotionItem->discount_type
            ?: $promotionItem->promotion->discount_type;

        $discountValue = $promotionItem->discount_value
            ?? $promotionItem->promotion->discount_value;

        $discountAmount = $this->calculateDiscount(
            $originalPrice,
            $discountType,
            $discountValue
        );

        $finalPrice = max($originalPrice - $discountAmount, 0);

        $promotionData = [
            'id' => $promotionItem->promotion->id,
            'title' => $promotionItem->promotion->title,
            'discount_type' => $discountType,
            'discount_value' => (float) $discountValue,
            'promotion_item_id' => $promotionItem->id,
        ];

        if (!$user) {

            return [
                'original_price' => $originalPrice,
                'discount_amount' => 0,
                'final_price' => $originalPrice,

                'promotion_price' => $finalPrice,

                'promotion' => $promotionData,

                'has_promotion' => true,

                'promotion_login_required' => true,
            ];
        }

        return [
            'original_price' => $originalPrice,

            'discount_amount' => $discountAmount,

            'final_price' => $finalPrice,

            'promotion_price' => $finalPrice,

            'promotion' => $promotionData,

            'has_promotion' => true,

            'promotion_login_required' => false,
        ];
    }

    public function findActivePromotionItem(ProductVariant $variant, int $quantity = 1): ?PromotionItem
    {
        //thứ tự:
        // 1. Promotion có giá sau giảm thấp nhất
        // 2. Promotion áp dụng trực tiếp cho variant
        // 3. Nếu bằng nhau, promotion kết thúc sớm hơn
        // 4. Nếu vẫn bằng nhau, promotion mới hơn
        $items = PromotionItem::query()
            ->with('promotion')
            ->where('is_active', true)
            ->where(function ($q) use ($variant) {
                $q->where('product_variant_id', $variant->id)
                    ->orWhere(function ($sub) use ($variant) {
                        $sub->whereNull('product_variant_id')
                            ->where('product_id', $variant->product_id);
                    });
            })
            ->whereHas('promotion', function ($q) {
                $q->where('is_active', true)
                    ->where('status', 'active')
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now());
            })
            ->where(function ($q) use ($quantity) {
                $q->whereNull('limit_quantity')
                    ->orWhereRaw(
                        '(sold_quantity + reserved_quantity + ?) <= limit_quantity',
                        [$quantity]
                    );
            })
            ->get();

        if ($items->isEmpty()) {
            return null;
        }

        $originalPrice = (float) $variant->price;

        return $items
            ->sortBy(function ($item) use ($variant, $originalPrice) {
                $discountType = $item->discount_type
                    ?: $item->promotion->discount_type;

                $discountValue = $item->discount_value
                    ?? $item->promotion->discount_value;

                $discountAmount = $this->calculateDiscount(
                    $originalPrice,
                    $discountType,
                    (float) $discountValue
                );

                $finalPrice = max(
                    $originalPrice - $discountAmount,
                    0
                );

                $variantPriority = $item->product_variant_id === $variant->id
                    ? 0
                    : 1;

                return [
                    $finalPrice,
                    $variantPriority,
                    optional($item->promotion->end_date)->timestamp ?? PHP_INT_MAX,
                    -$item->id,
                ];
            })
            ->first();
    }

    private function calculateDiscount(
        float $price,
        string $discountType,
        float $discountValue
    ): float {
        if ($discountType === 'percent') {
            return round($price * ($discountValue / 100), 2);
        }

        return min($discountValue, $price);
    }
}