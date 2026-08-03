<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\PromotionItem;
use Illuminate\Database\Seeder;

class PromotionItemSeeder extends Seeder
{
    public function run(): void
    {
        $promotionRules = [
            'Chào tân sinh viên K2026' => [
                ['type' => 'product', 'product' => 'Áo thun CTUT K2026', 'discount_type' => 'percent', 'discount_value' => 10],
                ['type' => 'product', 'product' => 'Hoodie CTUT Premium', 'discount_type' => 'percent', 'discount_value' => 10],
                ['type' => 'product', 'product' => 'Áo Freshman Week 2026', 'discount_type' => 'percent', 'discount_value' => 10],
                ['type' => 'product', 'product' => 'Túi tote CTUT', 'discount_type' => 'percent', 'discount_value' => 10],
            ],
            'Flash Sale cuối tuần CTUT' => [
                ['type' => 'variant', 'product' => 'Ly giữ nhiệt CTUT', 'attributes' => ['capacity' => '750ml'], 'discount_type' => 'fixed', 'discount_value' => 15000],
                ['type' => 'variant', 'product' => 'Sticker CTUT', 'attributes' => ['package' => 'Combo 20 sticker'], 'discount_type' => 'fixed', 'discount_value' => 5000],
                ['type' => 'variant', 'product' => 'Bảng tên sinh viên CTUT', 'attributes' => ['type' => 'Sinh viên'], 'discount_type' => 'fixed', 'discount_value' => 15000],
            ],
            'Tuần lễ khai giảng sắp tới' => [
                ['type' => 'product', 'product' => 'Sổ tay CTUT', 'discount_type' => 'percent', 'discount_value' => 12],
                ['type' => 'product', 'product' => 'Bút CTUT', 'discount_type' => 'percent', 'discount_value' => 12],
                ['type' => 'product', 'product' => 'Dây đeo thẻ CTUT', 'discount_type' => 'percent', 'discount_value' => 12],
            ],
            'Black Friday CTUT 2025' => [
                ['type' => 'product', 'product' => 'Nón lưỡi trai CTUT', 'discount_type' => 'percent', 'discount_value' => 25],
                ['type' => 'product', 'product' => 'Móc khóa CTUT', 'discount_type' => 'percent', 'discount_value' => 25],
                ['type' => 'product', 'product' => 'Túi tote CTUT', 'discount_type' => 'percent', 'discount_value' => 25],
            ],
            'Ưu đãi nội bộ chờ duyệt' => [
                ['type' => 'product', 'product' => 'Áo khoa CNTT', 'discount_type' => 'fixed', 'discount_value' => 10000],
            ],
            'Đợt ưu đãi tạm dừng' => [
                ['type' => 'product', 'product' => 'Áo khoa Điện - Điện tử', 'discount_type' => 'percent', 'discount_value' => 8],
            ],
        ];

        foreach ($promotionRules as $promotionTitle => $rules) {
            $promotion = Promotion::where('title', $promotionTitle)->first();

            if (!$promotion) {
                continue;
            }

            foreach ($rules as $rule) {
                $product = Product::where('name', $rule['product'])->first();

                if (!$product) {
                    continue;
                }

                if ($rule['type'] === 'product') {
                    $this->upsertProductPromotionItem(
                        $promotion->id,
                        $product->id,
                        $rule['discount_type'],
                        $rule['discount_value'],
                        $promotion->is_active
                    );
                    continue;
                }

                $variant = $this->findVariantByAttributes($product->id, $rule['attributes'] ?? []);

                if (!$variant) {
                    continue;
                }

                $this->upsertVariantPromotionItem(
                    $promotion->id,
                    $product->id,
                    $variant,
                    $rule['discount_type'],
                    $rule['discount_value'],
                    $promotion->is_active
                );
            }
        }
    }

    private function upsertProductPromotionItem(
        int $promotionId,
        int $productId,
        string $discountType,
        float $discountValue,
        bool $isActive
    ): void {
        PromotionItem::updateOrCreate([
            'promotion_id' => $promotionId,
            'product_id' => $productId,
            'variant_unique_key' => 0,
        ], [
            'promotion_id' => $promotionId,
            'product_id' => $productId,
            'product_variant_id' => null,
            'variant_unique_key' => 0,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'limit_quantity' => null,
            'sold_quantity' => 0,
            'reserved_quantity' => 0,
            'is_active' => $isActive,
        ]);
    }

    private function upsertVariantPromotionItem(
        int $promotionId,
        int $productId,
        ProductVariant $variant,
        string $discountType,
        float $discountValue,
        bool $isActive
    ): void {
        PromotionItem::updateOrCreate([
            'promotion_id' => $promotionId,
            'product_id' => $productId,
            'variant_unique_key' => $variant->id,
        ], [
            'promotion_id' => $promotionId,
            'product_id' => $productId,
            'product_variant_id' => $variant->id,
            'variant_unique_key' => $variant->id,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'limit_quantity' => null,
            'sold_quantity' => 0,
            'reserved_quantity' => 0,
            'is_active' => $isActive,
        ]);
    }

    private function findVariantByAttributes(int $productId, array $attributes): ?ProductVariant
    {
        return ProductVariant::where('product_id', $productId)
            ->get()
            ->first(function (ProductVariant $variant) use ($attributes) {
                foreach ($attributes as $key => $value) {
                    if (($variant->attributes[$key] ?? null) !== $value) {
                        return false;
                    }
                }

                return true;
            });
    }
}
