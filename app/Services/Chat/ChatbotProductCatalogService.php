<?php

namespace App\Services\Chat;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Services\PromotionPriceService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ChatbotProductCatalogService
{
    public function __construct(
        protected PromotionPriceService $promotionPriceService
    ) {}

    public function getProductByName(string $name, $user = null): array
    {
        $name = trim($name);

        if ($name === '') {
            return [
                'found' => false,
                'message' => 'Tên sản phẩm không hợp lệ.',
            ];
        }

        $product = $this->baseProductQuery()
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

        $userKey = $user?->id ? 'user_' . $user->id : 'guest';
        $cacheKey = 'chatbot:products:search:v2:' . md5($userKey . '|' . $query . '|' . $limit);

        return Cache::remember($cacheKey, now()->addMinutes(3), function () use ($query, $limit, $user) {
            $keywords = $this->extractProductSearchKeywords($query);
            $products = $this->queryProductsForIntent($query, $keywords, $limit);

            $matchedProducts = $products
                ->map(function ($product) use ($keywords, $query, $user) {
                    $score = $this->calculateProductSearchScore($product, $keywords, $query);

                    if ($score <= 0) {
                        return null;
                    }

                    $formatted = $this->formatProduct($product, $user);
                    $formatted['search_score'] = $score;
                    $formatted['matched_keywords'] = $keywords;

                    return $formatted;
                })
                ->filter()
                ->sortByDesc('search_score')
                ->take($limit)
                ->values()
                ->toArray();

            if (empty($matchedProducts) && $this->isGenericProductSuggestionQuery($query)) {
                $matchedProducts = $this->baseProductQuery()
                    ->latest()
                    ->limit($limit)
                    ->get()
                    ->map(function ($product) use ($user) {
                        $formatted = $this->formatProduct($product, $user);
                        $formatted['search_score'] = 1;
                        $formatted['matched_keywords'] = [];

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
        });
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
            return $this->variantNotFoundResponse($product);
        }

        return [
            'found' => true,
            'product' => $this->minimalProduct($product),
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
            return $this->variantNotFoundResponse($product);
        }

        return [
            'found' => true,
            'product' => $this->minimalProduct($product),
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
            'product' => $this->minimalProduct($product),
            'variants' => $product->variants
                ->map(fn ($variant) => array_merge(
                    $this->formatVariantPrice($variant, $user),
                    $this->formatVariantStock($variant)
                ))
                ->values()
                ->toArray(),
        ];
    }

    public function getProductRecommendations(string $type = 'popular', int $limit = 5, $user = null): array
    {
        $type = $this->normalizeRecommendationType($type);
        $limit = max(1, min($limit, 10));
        $userKey = $user?->id ? 'user_' . $user->id : 'guest';
        $cacheKey = 'chatbot:products:recommendations:v1:' . md5($userKey . '|' . $type . '|' . $limit);

        return Cache::remember($cacheKey, now()->addMinutes(3), function () use ($type, $limit, $user) {
            $query = $this->baseProductQuery();

            match ($type) {
                'featured' => $query->where('is_featured', true)
                    ->orderByDesc('average_rating')
                    ->orderByDesc('sold_count')
                    ->latest('created_at'),
                'best_selling' => $query->orderByDesc('sold_count')
                    ->orderByDesc('average_rating')
                    ->latest('created_at'),
                'top_rated' => $query->where('average_rating', '>', 0)
                    ->orderByDesc('average_rating')
                    ->orderByDesc('total_reviews')
                    ->latest('created_at'),
                'newest' => $query->latest('created_at'),
                default => $query->orderByDesc('is_featured')
                    ->orderByDesc('sold_count')
                    ->orderByDesc('view_count')
                    ->orderByDesc('average_rating')
                    ->latest('created_at'),
            };

            $products = $query
                ->limit($limit)
                ->get()
                ->map(function ($product) use ($user, $type) {
                    $formatted = $this->formatProduct($product, $user);
                    $formatted['recommendation_type'] = $type;

                    return $formatted;
                })
                ->values()
                ->toArray();

            if (empty($products) && $type === 'featured') {
                return $this->getProductRecommendations('popular', $limit, $user);
            }

            return [
                'found' => !empty($products),
                'type' => $type,
                'products' => $products,
            ];
        });
    }

    public function getPromotionByName(string $name): array
    {
        $name = trim($name);

        if ($name === '') {
            return [
                'found' => false,
                'message' => 'Ten khuyen mai khong hop le.',
            ];
        }

        $promotion = $this->basePromotionQuery()
            ->where(function ($query) use ($name) {
                $query->where('title', 'like', "%{$name}%")
                    ->orWhere('slug', 'like', "%{$name}%")
                    ->orWhere('description', 'like', "%{$name}%");
            })
            ->first();

        if (!$promotion) {
            return [
                'found' => false,
                'message' => 'Khong tim thay khuyen mai phu hop trong he thong.',
            ];
        }

        return [
            'found' => true,
            'promotion' => $this->formatPromotion($promotion),
        ];
    }

    public function searchPromotions(string $query, int $limit = 5): array
    {
        $query = trim($query);
        $limit = max(1, min($limit, 10));

        if ($query === '') {
            return [
                'found' => false,
                'message' => 'Tu khoa khuyen mai khong hop le.',
                'promotions' => [],
            ];
        }

        $promotions = $this->basePromotionQuery()
            ->where(function ($builder) use ($query) {
                $builder->where('title', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%");
            })
            ->orderBy('end_date')
            ->limit($limit)
            ->get()
            ->map(fn ($promotion) => $this->formatPromotion($promotion))
            ->values()
            ->toArray();

        return [
            'found' => !empty($promotions),
            'query' => $query,
            'promotions' => $promotions,
        ];
    }

    public function getActivePromotions(int $limit = 5): array
    {
        $limit = max(1, min($limit, 10));

        $promotions = $this->basePromotionQuery()
            ->orderBy('end_date')
            ->limit($limit)
            ->get()
            ->map(fn ($promotion) => $this->formatPromotion($promotion))
            ->values()
            ->toArray();

        return [
            'found' => !empty($promotions),
            'promotions' => $promotions,
        ];
    }

    public function getPromotionProducts(string $query, int $limit = 6, $user = null): array
    {
        $query = trim($query);
        $limit = max(1, min($limit, 12));

        $promotion = $query === ''
            ? $this->basePromotionQuery()->orderBy('end_date')->first()
            : $this->basePromotionQuery()
                ->where(function ($builder) use ($query) {
                    $builder->where('title', 'like', "%{$query}%")
                        ->orWhere('slug', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%");
                })
                ->orderBy('end_date')
                ->first();

        if (!$promotion) {
            return [
                'found' => false,
                'message' => 'Khong tim thay chuong trinh khuyen mai phu hop trong he thong.',
                'products' => [],
            ];
        }

        $promotion->loadMissing([
            'items' => function ($itemQuery) {
                $itemQuery->where('is_active', true);
            },
            'items.product.images',
            'items.product.variants' => function ($variantQuery) {
                $variantQuery->where('is_active', true);
            },
            'items.product.category:id,name,slug',
            'items.productVariant',
        ]);

        $products = $promotion->items
            ->filter(fn ($item) => $item->product && $item->product->is_active)
            ->take($limit)
            ->map(function ($item) use ($promotion, $user) {
                $product = $item->product;
                $formattedProduct = $this->formatProduct($product, $user);

                return [
                    ...$formattedProduct,
                    'promotion' => [
                        'id' => $promotion->id,
                        'title' => $promotion->title,
                        'slug' => $promotion->slug,
                        'discount_type' => $item->discount_type ?? $promotion->discount_type,
                        'discount_value' => $item->discount_value !== null
                            ? (float) $item->discount_value
                            : ($promotion->discount_value !== null ? (float) $promotion->discount_value : null),
                        'start_date' => optional($promotion->start_date)->format('d/m/Y H:i'),
                        'end_date' => optional($promotion->end_date)->format('d/m/Y H:i'),
                        'url' => url('/promotions/' . $promotion->slug),
                    ],
                    'promotion_variant' => $item->productVariant ? [
                        'id' => $item->productVariant->id,
                        'sku' => $item->productVariant->sku,
                        'size' => $item->productVariant->size,
                        'color' => $item->productVariant->color,
                        'price' => $item->productVariant->price !== null ? (float) $item->productVariant->price : null,
                    ] : null,
                ];
            })
            ->values()
            ->toArray();

        return [
            'found' => !empty($products),
            'promotion' => $this->formatPromotion($promotion),
            'products' => $products,
        ];
    }

    private function baseProductQuery()
    {
        return Product::query()
            ->select([
                'id',
                'category_id',
                'name',
                'slug',
                'description',
                'average_rating',
                'total_reviews',
                'is_featured',
                'sold_count',
                'view_count',
                'is_active',
                'created_at',
            ])
            ->with([
                'category:id,name,slug',
                'images:id,product_id,url,type,position',
                'variants' => function ($q) {
                    $q->select([
                        'id',
                        'product_id',
                        'sku',
                        'size',
                        'color',
                        'price',
                        'stock',
                        'reserved_stock',
                        'sold_stock',
                        'is_active',
                    ])->where('is_active', true);
                },
            ])
            ->where('is_active', true);
    }

    private function basePromotionQuery()
    {
        return Promotion::query()
            ->withCount('items')
            ->where('is_active', true)
            ->where('status', 'active')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    private function queryProductsForIntent(string $query, array $keywords, int $limit)
    {
        $normalizedQuery = $this->normalizeSearchText($query);

        return $this->baseProductQuery()
            ->where(function ($q) use ($query, $keywords, $normalizedQuery) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$normalizedQuery}%")
                    ->orWhereHas('category', function ($categoryQuery) use ($query, $normalizedQuery) {
                        $categoryQuery->where('name', 'like', "%{$query}%")
                            ->orWhere('slug', 'like', "%{$normalizedQuery}%");
                    });

                foreach (array_slice($keywords, 0, 8) as $keyword) {
                    $q->orWhere('name', 'like', "%{$keyword}%")
                        ->orWhere('slug', 'like', "%{$keyword}%");
                }
            })
            ->latest()
            ->limit(max(20, $limit * 5))
            ->get();
    }

    private function findProduct(string $name): ?Product
    {
        $name = trim($name);

        if ($name === '') {
            return null;
        }

        return $this->baseProductQuery()
            ->where(function ($q) use ($name) {
                $q->where('name', 'like', "%{$name}%")
                    ->orWhere('slug', 'like', "%{$name}%");
            })
            ->first();
    }

    private function formatProduct(Product $product, $user = null): array
    {
        $variants = $product->variants;
        $prices = $variants->pluck('price')->filter();
        $imageUrl = $this->normalizeAssetUrl($product->images->sortBy('position')->first()?->url);
        $productUrl = url('/product/' . $product->slug);
        $availableStock = $variants->sum(fn ($variant) => max(0, (int) $variant->stock - (int) $variant->reserved_stock));
        $minPrice = $prices->min() ? (float) $prices->min() : null;
        $maxPrice = $prices->max() ? (float) $prices->max() : null;

        return [
            ...$this->minimalProduct($product),
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
            ] : null,
            'image' => $imageUrl,
            'image_url' => $imageUrl,
            'thumbnail' => $imageUrl,
            'price' => [
                'min' => $minPrice,
                'max' => $maxPrice,
            ],
            'min_price' => $minPrice,
            'max_price' => $maxPrice,
            'available_sizes' => $variants->pluck('size')->filter()->unique()->values()->toArray(),
            'available_colors' => $variants->pluck('color')->filter()->unique()->values()->toArray(),
            'stock' => [
                'available' => $availableStock,
            ],
            'available_stock' => $availableStock,
            'in_stock' => $availableStock > 0,
            'rating' => [
                'average' => (float) ($product->average_rating ?? 0),
                'total_reviews' => (int) ($product->total_reviews ?? 0),
            ],
            'url' => $productUrl,
            'product_url' => $productUrl,
        ];
    }

    private function normalizeAssetUrl(?string $path): ?string
    {
        $path = trim((string) $path);

        if ($path === '') {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', '/'])) {
            return $path;
        }

        return asset($path);
    }

    private function minimalProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'short_description' => Str::limit(strip_tags((string) $product->description), 180),
        ];
    }

    private function formatPromotion(Promotion $promotion): array
    {
        return [
            'id' => $promotion->id,
            'title' => $promotion->title,
            'slug' => $promotion->slug,
            'description' => Str::limit(strip_tags((string) $promotion->description), 220),
            'discount_type' => $promotion->discount_type,
            'discount_value' => $promotion->discount_value !== null ? (float) $promotion->discount_value : null,
            'start_date' => optional($promotion->start_date)->format('d/m/Y H:i'),
            'end_date' => optional($promotion->end_date)->format('d/m/Y H:i'),
            'thumbnail' => $this->normalizeAssetUrl($promotion->thumbnail),
            'banner' => $this->normalizeAssetUrl($promotion->banner),
            'url' => url('/promotions/' . $promotion->slug),
            'products_count' => (int) ($promotion->items_count ?? 0),
        ];
    }

    private function variantNotFoundResponse(Product $product): array
    {
        return [
            'found' => false,
            'message' => 'Không tìm thấy biến thể phù hợp với kích thước hoặc màu sắc đã hỏi.',
            'product' => $this->minimalProduct($product),
            'available_sizes' => $product->variants->pluck('size')->filter()->unique()->values()->toArray(),
            'available_colors' => $product->variants->pluck('color')->filter()->unique()->values()->toArray(),
        ];
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
        $requestedColor = $this->removeColorWords($this->normalizeSearchText($requestedColor));

        if ($requestedColor === '') {
            return true;
        }

        return str_contains($variantColor, $requestedColor);
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
        $normalized = $this->normalizeCommonVietnameseTypos($this->normalizeSearchText($query));

        if ($normalized === '') {
            return [];
        }

        $tokens = preg_split('/\s+/', $normalized) ?: [];
        $tokens = array_filter(array_map(fn ($token) => trim($token), $tokens), function ($token) {
            return $token !== ''
                && mb_strlen($token) > 1
                && !in_array($token, $this->productSearchStopWords(), true);
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
            data_get($product, 'category.name', ''),
        ])));

        if ($searchText === '') {
            return 0;
        }

        $score = 0;

        foreach ($keywords as $keyword) {
            if (str_contains($searchText, $keyword)) {
                $score += 10;
            }

            if (str_contains($this->normalizeSearchText((string) $product->name), $keyword)) {
                $score += 20;
            }
        }

        $normalizedQuery = $this->normalizeSearchText($originalQuery);

        if ($normalizedQuery !== '' && str_contains($searchText, $normalizedQuery)) {
            $score += 30;
        }

        return $score;
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

    private function normalizeRecommendationType(string $type): string
    {
        $normalized = $this->normalizeSearchText($type);

        if (str_contains($normalized, 'danh gia') || str_contains($normalized, 'rating') || str_contains($normalized, 'rated') || str_contains($normalized, 'review')) {
            return 'top_rated';
        }

        if (str_contains($normalized, 'ban chay') || str_contains($normalized, 'best sell') || str_contains($normalized, 'selling')) {
            return 'best_selling';
        }

        if (str_contains($normalized, 'moi') || str_contains($normalized, 'new') || str_contains($normalized, 'latest')) {
            return 'newest';
        }

        if (str_contains($normalized, 'noi bat') || str_contains($normalized, 'featured')) {
            return 'featured';
        }

        return 'popular';
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

        return trim(preg_replace('/\s+/', ' ', $value));
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

        foreach (['goi y', 'tu van', 'san pham phu hop', 'qua tang', 'mua gi', 'co san pham nao', 'shop co gi'] as $phrase) {
            if (str_contains($normalized, $phrase)) {
                return true;
            }
        }

        return false;
    }
}
