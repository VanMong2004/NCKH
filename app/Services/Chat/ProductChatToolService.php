<?php

namespace App\Services\Chat;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\ProductService;
use App\Services\PromotionPriceService;
use Illuminate\Support\Str;

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

        $keywords = $this->extractProductSearchKeywords($query);

        $products = Product::query()
            ->with(['images', 'variants', 'category'])
            ->where('is_active', true)
            ->latest()
            ->limit(300)
            ->get();

        $matchedProducts = $products
            ->map(function ($product) use ($keywords, $query, $user) {
                $score = $this->calculateProductSearchScore($product, $keywords, $query);

                if ($score <= 0) {
                    return null;
                }

                $formatted = $this->formatProduct($product, $user);

                $formatted['search_score'] = $score;
                $formatted['matched_keywords'] = $keywords;
                $formatted['available_sizes'] = $product->variants
                    ->pluck('size')
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray();

                $formatted['available_colors'] = $product->variants
                    ->pluck('color')
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray();

                return $formatted;
            })
            ->filter()
            ->sortByDesc('search_score')
            ->take($limit)
            ->values()
            ->toArray();

        if (empty($matchedProducts) && $this->isGenericProductSuggestionQuery($query)) {
            $matchedProducts = $products
                ->take($limit)
                ->map(function ($product) use ($user) {
                    $formatted = $this->formatProduct($product, $user);

                    $formatted['search_score'] = 1;
                    $formatted['matched_keywords'] = [];
                    $formatted['available_sizes'] = $product->variants
                        ->pluck('size')
                        ->filter()
                        ->unique()
                        ->values()
                        ->toArray();

                    $formatted['available_colors'] = $product->variants
                        ->pluck('color')
                        ->filter()
                        ->unique()
                        ->values()
                        ->toArray();

                    return $formatted;
                })
                ->values()
                ->toArray();
        }

        return [
            'found' => !empty($matchedProducts),
            'query' => $query,
            'normalized_query' => $this->normalizeSearchText($query),
            'keywords' => $keywords,
            'products' => $matchedProducts,
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
                    'slug' => $product->slug,
                ],
                'available_sizes' => $product->variants
                    ->pluck('size')
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray(),
                'available_colors' => $product->variants
                    ->pluck('color')
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray(),
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
                    'slug' => $product->slug,
                ],
                'available_sizes' => $product->variants
                    ->pluck('size')
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray(),
                'available_colors' => $product->variants
                    ->pluck('color')
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray(),
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
                return $this->sizeMatches($variant->size, $size)
                    && $this->colorMatches($variant->color, $color);
            })
            ->values();
    }

    private function sizeMatches(?string $variantSize, ?string $requestedSize): bool
    {
        $requestedSize = trim((string) $requestedSize);

        if ($requestedSize === '') {
            return true;
        }

        return $this->normalizeSearchText((string) $variantSize)
            === $this->normalizeSearchText($requestedSize);
    }

    private function colorMatches(?string $variantColor, ?string $requestedColor): bool
    {
        $requestedColor = trim((string) $requestedColor);

        if ($requestedColor === '') {
            return true;
        }

        $variantColor = $this->normalizeSearchText((string) $variantColor);
        $requestedColor = $this->normalizeSearchText($requestedColor);

        $requestedColor = $this->removeColorWords($requestedColor);

        if ($requestedColor === '') {
            return true;
        }

        return str_contains($variantColor, $requestedColor);
    }

    private function normalizeSearchText(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return '';
        }

        $value = Str::ascii($value);
        $value = mb_strtolower($value);
        $value = preg_replace('/\s+/', ' ', $value);

        return trim($value);
    }

    private function removeColorWords(string $value): string
    {
        $value = preg_replace('/\b(mau|color|tone|tong)\b/u', ' ', $value);
        $value = preg_replace('/\s+/', ' ', $value);

        return trim($value);
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

    private function extractProductSearchKeywords(string $query): array
    {
        $normalized = $this->normalizeSearchText($query);

        if ($normalized === '') {
            return [];
        }

        $normalized = $this->normalizeCommonVietnameseTypos($normalized);

        $tokens = preg_split('/\s+/', $normalized) ?: [];

        $tokens = array_map(
            fn ($token) => trim($token),
            $tokens
        );

        $tokens = array_filter($tokens, function ($token) {
            if ($token === '') {
                return false;
            }

            if (mb_strlen($token) <= 1) {
                return false;
            }

            return !in_array($token, $this->productSearchStopWords(), true);
        });

        $keywords = [];

        foreach ($tokens as $token) {
            $keywords[] = $token;

            foreach ($this->productSynonyms($token) as $synonym) {
                $keywords[] = $synonym;
            }
        }

        return array_values(array_unique($keywords));
    }

    private function calculateProductSearchScore(Product $product, array $keywords, string $originalQuery): int
    {
        $searchText = $this->normalizeSearchText(implode(' ', array_filter([
            $product->name ?? '',
            $product->slug ?? '',
            $product->description ?? '',
            $product->short_description ?? '',
            data_get($product, 'category.name', ''),
            data_get($product, 'category.title', ''),
        ])));

        if ($searchText === '') {
            return 0;
        }

        $score = 0;

        foreach ($keywords as $keyword) {
            if ($keyword === '') {
                continue;
            }

            if (str_contains($searchText, $keyword)) {
                $score += 10;
            }

            if (str_contains($this->normalizeSearchText((string) $product->name), $keyword)) {
                $score += 20;
            }

            if (str_contains($this->normalizeSearchText((string) data_get($product, 'category.name', '')), $keyword)) {
                $score += 8;
            }
        }

        $normalizedQuery = $this->normalizeSearchText($originalQuery);

        if ($normalizedQuery !== '' && str_contains($searchText, $normalizedQuery)) {
            $score += 30;
        }

        return $score;
    }

    private function normalizeCommonVietnameseTypos(string $value): string
    {
        $replaces = [
            ' loa ' => ' loai ',
            ' cac loa ' => ' cac loai ',
            ' cac loai ' => ' ',
            ' loai ' => ' ',
        ];

        $value = ' ' . $value . ' ';

        foreach ($replaces as $from => $to) {
            $value = str_replace($from, $to, $value);
        }

        $value = preg_replace('/\s+/', ' ', $value);

        return trim($value);
    }

    private function productSearchStopWords(): array
    {
        return [
            'shop',
            'store',
            'ctut',
            'ban',
            'co',
            'khong',
            'cac',
            'nhung',
            'loai',
            'loa',
            'nao',
            'gi',
            'hang',
            'san',
            'pham',
            'minh',
            'toi',
            'em',
            'anh',
            'chi',
            'can',
            'muon',
            'mua',
            'tim',
            'kiem',
            'xem',
            'cho',
            'hoi',
            'nhe',
            'nha',
        ];
    }

    private function productSynonyms(string $token): array
    {
        return match ($token) {
            'ao' => ['thun', 'polo', 'khoac', 'dong phuc'],
            'non' => ['mu', 'cap'],
            'balo' => ['ba lo', 'tui'],
            'binh' => ['ly', 'giu nhiet'],
            'qua', 'tang' => ['luu niem', 'phu kien'],
            default => [],
        };
    }

    private function isGenericProductSuggestionQuery(string $query): bool
    {
        $normalized = $this->normalizeSearchText($query);

        $genericPhrases = [
            'goi y',
            'tu van',
            'san pham phu hop',
            'qua tang',
            'mua gi',
            'co san pham nao',
            'shop co gi',
        ];

        foreach ($genericPhrases as $phrase) {
            if (str_contains($normalized, $phrase)) {
                return true;
            }
        }

        return false;
    }
}