<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Category;
use App\Models\ProductVariant;
use App\Models\RecentlyViewedProduct;
use App\Models\Review;
use RuntimeException;
use App\Services\PromotionPriceService;


class ProductService
{
    public function __construct(
        protected PromotionPriceService $promotionPriceService
    ) {}

    private const MAX_PAGE_SIZE = 50;
    private const RELATED_PRODUCTS_LIMIT = 8;

    // =========================
    // LIST + FILTER
    // =========================
    public function getList(array $filters = [], $user = null)
    {
        $perPage = min(
            $filters['per_page'] ?? 10,
            self::MAX_PAGE_SIZE
        );

        $query = Product::query()
            ->with([
                'images',
                'variants',
                'category.parent',
            ])
            ->where('is_active', true);

        /*
        |--------------------------------------------------------------------------
        | KEYWORD
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['keyword'])) {
            $keyword = $filters['keyword'];

            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | CATEGORY TREE
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['category_id'])) {
            $categoryIds = $this->getAllChildCategoryIds($filters['category_id']);

            $query->whereIn('category_id', $categoryIds);
        }

        /*
        |--------------------------------------------------------------------------
        | PRICE FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['min_price']) || !empty($filters['max_price'])) {
            $query->whereHas('variants', function ($q) use ($filters) {
                if (!empty($filters['min_price'])) {
                    $q->where('price', '>=', $filters['min_price']);
                }

                if (!empty($filters['max_price'])) {
                    $q->where('price', '<=', $filters['max_price']);
                }
            });
        }

        /*
        |--------------------------------------------------------------------------
        | SIZE FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['sizes'])) {
            $sizes = is_array($filters['sizes'])
                ? $filters['sizes']
                : explode(',', $filters['sizes']);

            $query->whereHas('variants', function ($q) use ($sizes) {
                $q->whereIn('size', $sizes);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | COLOR FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['colors'])) {
            $colors = is_array($filters['colors'])
                ? $filters['colors']
                : explode(',', $filters['colors']);

            $query->whereHas('variants', function ($q) use ($colors) {
                $q->whereIn('color', $colors);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | RATING FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['rating'])) {
            $query->where('average_rating', '>=', $filters['rating']);
        }

        /*
        |--------------------------------------------------------------------------
        | IN STOCK
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['in_stock'])) {
            $query->whereHas('variants', function ($q) {
                $q->whereRaw('(stock - reserved_stock) > 0');
            });
        }

        /*
        |--------------------------------------------------------------------------
        | SORT
        |--------------------------------------------------------------------------
        */

        switch ($filters['sort'] ?? 'newest') {
            case 'oldest':
                $query->oldest();
                break;

            case 'price_asc':
                $query->withMin('variants', 'price')
                    ->orderBy('variants_min_price', 'asc');
                break;

            case 'price_desc':
                $query->withMin('variants', 'price')
                    ->orderBy('variants_min_price', 'desc');
                break;

            case 'rating':
                $query->orderByDesc('average_rating');
                break;

            case 'best_selling':
                $query->orderByDesc('sold_count');
                break;

            case 'popular':
                $query->orderByDesc('view_count');
                break;

            default:
                $query->latest();
                break;
        }

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $products = $query->paginate($perPage);

        /*
        |--------------------------------------------------------------------------
        | TRANSFORM
        |--------------------------------------------------------------------------
        */

        $data = collect($products->items())
            ->map(function ($product) use ($user) {
                return $this->formatProduct($product, $user);
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | FILTER METADATA
        |--------------------------------------------------------------------------
        */

        $allVariants = ProductVariant::query();

        $filterMeta = [
            'sizes' => $allVariants
                ->select('size')
                ->distinct()
                ->pluck('size'),

            'colors' => ProductVariant::query()
                ->select('color')
                ->distinct()
                ->pluck('color'),

            'price_range' => [
                'min' => ProductVariant::min('price'),
                'max' => ProductVariant::max('price'),
            ],

            'categories' => Category::query()
                ->whereNull('parent_id')
                ->with('children')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,

                        'name' => $item->name,

                        'slug' => $item->slug,

                        'children' => $item->children->map(
                            fn ($child) => [
                                'id' => $child->id,
                                'name' => $child->name,
                                'slug' => $child->slug,
                            ]
                        ),
                    ];
                }),
        ];

        return [
            'success' => true,

            'message' => 'Lấy danh sách sản phẩm thành công',

            'data' => $data,

            'meta' => [
                'current_page' => $products->currentPage(),

                'last_page' => $products->lastPage(),

                'per_page' => $products->perPage(),

                'total' => $products->total(),
            ],

            'filters' => $filterMeta,
        ];
    }

    // =========================
    // DETAIL
    // =========================
    public function show(string $slug, $user = null)
    {
        $product = Product::query()
            ->with([
                'images',
                'variants',
                'category.parent',
                'reviews.user',
            ])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            throw new RuntimeException('Sản phẩm không tồn tại');
        }

        /*
        |--------------------------------------------------------------------------
        | AUTO SAVE RECENTLY VIEWED
        |--------------------------------------------------------------------------
        */

        if ($user) {
            RecentlyViewedProduct::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                ],
                [
                    'viewed_at' => now(),
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AVAILABLE ATTRIBUTES
        |--------------------------------------------------------------------------
        */

        $sizes = $product->variants
            ->pluck('size')
            ->filter()
            ->unique()
            ->values();

        $colors = $product->variants
            ->pluck('color')
            ->filter()
            ->unique()
            ->values();

        /*
        |--------------------------------------------------------------------------
        | STOCK
        |--------------------------------------------------------------------------
        */

        $inStock = $product->variants
            ->contains(function ($variant) {
                return ($variant->stock - $variant->reserved_stock) > 0;
            });

        /*
        |--------------------------------------------------------------------------
        | REVIEW SUMMARY
        |--------------------------------------------------------------------------
        */

        $ratingBreakdown = [];

        for ($i = 5; $i >= 1; $i--) {
            $ratingBreakdown[$i] = $product->reviews
                ->where('rating', $i)
                ->count();
        }

        /*
        |--------------------------------------------------------------------------
        | RELATED PRODUCTS
        |--------------------------------------------------------------------------
        */

        $relatedProducts = Product::query()
            ->with([
                'images',
                'variants',
                'category.parent',
            ])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->withSum('variants', 'sold_stock')
            ->orderByDesc('variants_sum_sold_stock')
            ->orderByDesc('average_rating')
            ->latest()
            ->limit(self::RELATED_PRODUCTS_LIMIT)
            ->get()
            ->map(
                fn ($item)
                => $this->formatProduct(
                    $item,
                    $user
                )
            );

        return [
            'success' => true,

            'message' => 'Lấy chi tiết sản phẩm thành công',

            'data' => [
                ...$this->formatProduct(
                        $product,
                        $user
                    ),

                'description' => $product->description,

                'images' => $product->images->map(fn ($image) => [
                    'url' => $image->url,
                    'type' => $image->type,
                ]),

                'variants' => $product->variants
                    ->map(function ($variant) use ($user) {

                        $priceData =
                            $this->promotionPriceService
                                ->calculateForVariant(
                                    $variant,
                                    $user
                                );

                        return [

                            'id'
                                => $variant->id,

                            'size'
                                => $variant->size,

                            'color'
                                => $variant->color,

                            'sku'
                                => $variant->sku,

                            'price'
                                => $priceData['final_price'],

                            'original_price'
                                => $priceData['original_price'],

                            'discount_amount'
                                => $priceData['discount_amount'],

                            'promotion_price'
                                => $priceData['promotion_price'],

                            'has_promotion'
                                => $priceData['has_promotion'],

                            'promotion_login_required'
                                => $priceData['promotion_login_required'],

                            'promotion'
                                => $priceData['promotion'],

                            'stock'
                                => $variant->stock,

                            'reserved_stock'
                                => $variant->reserved_stock,

                            'sold_stock'
                                => $variant->sold_stock,

                            'available_stock'
                                => max(0, $variant->stock - $variant->reserved_stock),
                        ];
                    }),

                'available_sizes' => $sizes,

                'available_colors' => $colors,

                'average_rating' => (float) $product->average_rating,

                'total_reviews' => $product->total_reviews,

                'rating_breakdown' => $ratingBreakdown,

                'in_stock' => $inStock,

                'related_products' => $relatedProducts,

                'reviews' => $product->reviews->take(10)->map(fn ($review) => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'user' => [
                        'name' => $review->user?->name,
                        'avatar' => $review->user?->avatar_url,
                    ],
                    'created_at' => $review->created_at->format('d/m/Y'),
                ]),
            ],
        ];
    }

    // =========================
    // VARIANTS
    // =========================
    public function getVariants($productId)
    {
        $product = Product::with('variants')->find($productId);

        if (!$product) {
            throw new RuntimeException('Sản phẩm không tồn tại');
        }

        return [
            'success' => true,
            'data' => $this->groupVariants($product->variants),
        ];
    }

    // =========================
    // REVIEWS
    // =========================
    public function getReviews($productId)
    {
        $product = Product::find($productId);

        if (!$product) {
            throw new RuntimeException('Sản phẩm không tồn tại');
        }

        $reviews = $product
            ->reviews()
            ->with('user:id,name,avatar')
            ->latest()
            ->get();

        return [
            'success' => true,
            'data' => $reviews,
        ];
    }

    // =========================
    // FORMAT PRODUCT
    // =========================
    public function formatProduct($product, $user = null)
    {
        $availableStock = $product->variants->sum(function ($variant) {
            return max(0, $variant->stock - $variant->reserved_stock);
        });

        $sold = $product->variants->sum('sold_stock');

        $variantPrices = $product->variants
            ->map(function ($variant) use ($user) {
                return $this->promotionPriceService
                    ->calculateForVariant($variant, $user);
            });

        $minPrice = $variantPrices->min('final_price');
        $maxPrice = $variantPrices->max('final_price');

        $originalMinPrice = $variantPrices->min('original_price');
        $originalMaxPrice = $variantPrices->max('original_price');

        $promotionPrices = $variantPrices
            ->filter(fn ($item) => !is_null($item['promotion_price']));

        $promotionMinPrice = $promotionPrices->min('promotion_price');
        $promotionMaxPrice = $promotionPrices->max('promotion_price');

        $hasPromotion = $variantPrices->contains(
            fn ($item) => $item['has_promotion']
        );

        $promotionLoginRequired = $variantPrices->contains(
            fn ($item) => $item['promotion_login_required']
        );

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,

            // Key cũ FE đang dùng
            'min_price' => $minPrice,
            'max_price' => $maxPrice,

            // Key mới nếu FE muốn dùng rõ hơn
            // 'price_min' => $minPrice,
            // 'price_max' => $maxPrice,

            'original_min_price' => $originalMinPrice,
            'original_max_price' => $originalMaxPrice,

            'promotion_min_price' => $promotionMinPrice,
            'promotion_max_price' => $promotionMaxPrice,

            'has_promotion' => $hasPromotion,
            'promotion_login_required' => $promotionLoginRequired,

            'thumbnail' => optional(
                $product->images
                    ->where('type', 'thumbnail')
                    ->first()
            )->url
                ?? optional($product->images->first())->url
                ?? 'https://placehold.co/600x600?text=CTU',

            'images' => $product->images->map(fn ($image) => [
                'url' => $image->url,
                'type' => $image->type,
            ]),

            'rating' => (float) $product->average_rating,
            'average_rating' => (float) $product->average_rating,
            'review_count' => $product->total_reviews,
            'total_reviews' => $product->total_reviews,

            'sold' => $sold,
            'stock' => $availableStock,
            'available_stock' => $availableStock,
            'in_stock' => $availableStock > 0,

            'is_featured' => (bool) $product->is_featured,
            'is_active' => (bool) $product->is_active,

            'category' => [
                'id' => $product->category?->id,
                'name' => $product->category?->name,
                'slug' => $product->category?->slug,
                'parent' => $product->category?->parent
                    ? [
                        'id' => $product->category->parent->id,
                        'name' => $product->category->parent->name,
                        'slug' => $product->category->parent->slug,
                    ]
                    : null,
            ],
        ];
    }

    // =========================
    // GROUP VARIANTS (🔥 UI)
    // =========================
    private function groupVariants($variants)
    {
        $sizes = [];
        $colors = [];

        foreach ($variants as $variant) {
            if ($variant->size && !in_array($variant->size, $sizes)) {
                $sizes[] = $variant->size;
            }

            if ($variant->color && !in_array($variant->color, $colors)) {
                $colors[] = $variant->color;
            }
        }

        return [
            'sizes' => $sizes,
            'colors' => $colors,
            'variants' => $variants
        ];
    }

    // =========================
    // CATEGORY TREE
    // =========================
    private function getAllChildCategoryIds($categoryId)
    {
        $ids = [$categoryId];

        $children = Category::where('parent_id', $categoryId)->pluck('id');

        foreach ($children as $childId) {
            $ids = array_merge($ids, $this->getAllChildCategoryIds($childId));
        }

        return $ids;
    }

    // =========================
    // RECENTLY VIEWED PRODUCTS
    // =========================
    public function recentlyViewed($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        $items = RecentlyViewedProduct::query()
            ->with([
                'product.images',
                'product.variants',
                'product.category.parent',
            ])
            ->where('user_id', $user->id)
            ->orderByDesc('viewed_at')
            ->limit(20)
            ->get();

        return [
            'success' => true,

            'message' => 'Lấy recently viewed thành công',

            'data' => $items
                ->filter(fn ($item) => $item->product)
                ->map(function ($item) use ($user) {
                    return $this->formatProduct(
                        $item->product,
                        $user
                    );
                })
                ->values(),
        ];
    }
}