<?php

namespace App\Services\Chat;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\ProductService;
use App\Services\PromotionPriceService;

class ProductChatToolService
{
    public function __construct(
        protected ProductService $productService,
        protected PromotionPriceService $promotionPriceService
    ) {}

    public function execute(string $name, array $arguments, $user = null): array
    {
        return match ($name) {
            'get_product_by_name' => $this->getProductByName(
                (string) ($arguments['name'] ?? ''),
                $user
            ),

            'search_products' => $this->searchProducts(
                (string) ($arguments['query'] ?? ''),
                (int) ($arguments['limit'] ?? 5),
                $user
            ),

            'get_product_stock' => $this->getProductStock(
                (string) ($arguments['product_name'] ?? ''),
                $arguments['size'] ?? null,
                $arguments['color'] ?? null
            ),

            'get_product_price' => $this->getProductPrice(
                (string) ($arguments['product_name'] ?? ''),
                $arguments['size'] ?? null,
                $arguments['color'] ?? null,
                $user
            ),

            'get_product_variants' => $this->getProductVariants(
                (string) ($arguments['product_name'] ?? ''),
                $user
            ),

            default => [
                'found' => false,
                'message' => 'Tool không hợp lệ.',
            ],
        };
    }

    public function getProductByName(string $name, $user = null): array
    {
        $name = trim($name);

        if ($name === '') {
            return [
                'found' => false,
                'message' => 'Tên sản phẩm không hợp lệ.',
            ];
        }

        $product = Product::query()
            ->with(['images', 'variants', 'category'])
            ->where('is_active', true)
            ->where(function ($q) use ($name) {
                $q->where('name', 'like', "%{$name}%")
                    ->orWhere('slug', 'like', "%{$name}%");
            })
            ->first();

        if (!$product) {
            return [
                'found' => false,
                'message' => 'Không tìm thấy sản phẩm phù hợp trong hệ thống.',
            ];
        }

        return [
            'found' => true,
            'product' => $this->formatProduct($product, $user),
        ];
    }

    public function searchProducts(string $query, int $limit = 5, $user = null): array
    {
        $query = trim($query);
        $limit = max(1, min($limit, 10));

        if ($query === '') {
            return [
                'found' => false,
                'message' => 'Từ khóa tìm kiếm không hợp lệ.',
                'products' => [],
            ];
        }

        $products = Product::query()
            ->with(['images', 'variants', 'category'])
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%");
            })
            ->latest()
            ->limit($limit)
            ->get();

        return [
            'found' => $products->isNotEmpty(),
            'products' => $products
                ->map(fn ($product) => $this->formatProduct($product, $user))
                ->values()
                ->toArray(),
        ];
    }

    public function getProductStock(string $productName, ?string $size = null, ?string $color = null): array
    {
        $product = $this->findProduct($productName);

        if (!$product) {
            return [
                'found' => false,
                'message' => 'Không tìm thấy sản phẩm trong hệ thống.',
            ];
        }

        $variants = $this->filterVariants($product->variants, $size, $color);

        if ($variants->isEmpty()) {
            return [
                'found' => false,
                'message' => 'Không tìm thấy biến thể phù hợp với kích thước hoặc màu sắc đã hỏi.',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                ],
            ];
        }

        return [
            'found' => true,
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
            ],
            'variants' => $variants
                ->map(fn ($variant) => $this->formatVariantStock($variant))
                ->values()
                ->toArray(),
        ];
    }

    public function getProductPrice(string $productName, ?string $size = null, ?string $color = null, $user = null): array
    {
        $product = $this->findProduct($productName);

        if (!$product) {
            return [
                'found' => false,
                'message' => 'Không tìm thấy sản phẩm trong hệ thống.',
            ];
        }

        $variants = $this->filterVariants($product->variants, $size, $color);

        if ($variants->isEmpty()) {
            return [
                'found' => false,
                'message' => 'Không tìm thấy biến thể phù hợp với kích thước hoặc màu sắc đã hỏi.',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                ],
            ];
        }

        return [
            'found' => true,
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
            ],
            'variants' => $variants
                ->map(fn ($variant) => $this->formatVariantPrice($variant, $user))
                ->values()
                ->toArray(),
        ];
    }

    public function getProductVariants(string $productName, $user = null): array
    {
        $product = $this->findProduct($productName);

        if (!$product) {
            return [
                'found' => false,
                'message' => 'Không tìm thấy sản phẩm trong hệ thống.',
            ];
        }

        return [
            'found' => true,
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
            ],
            'variants' => $product->variants
                ->map(fn ($variant) => array_merge(
                    $this->formatVariantPrice($variant, $user),
                    $this->formatVariantStock($variant)
                ))
                ->values()
                ->toArray(),
        ];
    }

    private function findProduct(string $name): ?Product
    {
        $name = trim($name);

        if ($name === '') {
            return null;
        }

        return Product::query()
            ->with(['images', 'variants', 'category'])
            ->where('is_active', true)
            ->where(function ($q) use ($name) {
                $q->where('name', 'like', "%{$name}%")
                    ->orWhere('slug', 'like', "%{$name}%");
            })
            ->first();
    }

    private function filterVariants($variants, ?string $size = null, ?string $color = null)
    {
        return $variants
            ->filter(function ($variant) use ($size, $color) {
                $sizeMatched = true;
                $colorMatched = true;

                if ($size !== null && trim($size) !== '') {
                    $sizeMatched = mb_strtolower((string) $variant->size) === mb_strtolower(trim($size));
                }

                if ($color !== null && trim($color) !== '') {
                    $colorMatched = mb_strtolower((string) $variant->color) === mb_strtolower(trim($color));
                }

                return $sizeMatched && $colorMatched;
            })
            ->values();
    }

    private function formatProduct(Product $product, $user = null): array
    {
        $formatted = $this->productService->formatProduct($product, $user);

        return is_array($formatted)
            ? $formatted
            : json_decode(json_encode($formatted), true);
    }

    private function formatVariantPrice(ProductVariant $variant, $user = null): array
    {
        try {
            $price = $this->promotionPriceService->calculateForVariant($variant, $user, 1);
        } catch (\Throwable) {
            $price = [
                'original_price' => (float) $variant->price,
                'final_price' => (float) $variant->price,
                'discount_amount' => 0,
                'has_promotion' => false,
                'promotion_login_required' => false,
                'promotion' => null,
            ];
        }

        return [
            'variant_id' => $variant->id,
            'sku' => $variant->sku,
            'size' => $variant->size,
            'color' => $variant->color,
            'original_price' => (float) ($price['original_price'] ?? $variant->price),
            'final_price' => (float) ($price['final_price'] ?? $variant->price),
            'discount_amount' => (float) ($price['discount_amount'] ?? 0),
            'has_promotion' => (bool) ($price['has_promotion'] ?? false),
            'promotion_login_required' => (bool) ($price['promotion_login_required'] ?? false),
            'promotion' => $price['promotion'] ?? null,
        ];
    }

    private function formatVariantStock(ProductVariant $variant): array
    {
        $stock = (int) ($variant->stock ?? 0);
        $reserved = (int) ($variant->reserved_stock ?? 0);
        $available = max(0, $stock - $reserved);

        return [
            'variant_id' => $variant->id,
            'sku' => $variant->sku,
            'size' => $variant->size,
            'color' => $variant->color,
            'stock' => $stock,
            'reserved_stock' => $reserved,
            'available_stock' => $available,
            'sold_stock' => (int) ($variant->sold_stock ?? 0),
            'in_stock' => $available > 0,
        ];
    }
}