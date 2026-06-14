<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Category;
use App\Models\ProductVariant;
use App\Models\RecentlyViewedProduct;
use App\Models\Review;
use RuntimeException;


class ProductService
{
    private const MAX_PAGE_SIZE = 50;
    private const RELATED_PRODUCTS_LIMIT = 8;

    // =========================
    // LIST + FILTER
    // =========================
    public function getList(array $filters)
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
            ->map(function ($product) {
                $prices = $product->variants->pluck('price');

                $availableStock = $product->variants
                    ->sum(function ($variant) {
                        return max(
                            0,
                            $variant->stock - $variant->reserved_stock
                        );
                    });

                $sold = $product->variants->sum('sold_stock');

                return [
                    'id' => $product->id,

                    'name' => $product->name,

                    'slug' => $product->slug,

                    'description' => $product->description,

                    'thumbnail' => optional(
                        $product->images->where('type', 'thumbnail')->first()
                    )->url
                        ?? optional($product->images->first())->url
                        ?? 'https://placehold.co/600x600?text=CTU',

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

                    'min_price' => $prices->min(),

                    'max_price' => $prices->max(),

                    'average_rating' => (float) $product->average_rating,

                    'total_reviews' => $product->total_reviews,

                    'sold' => $sold,

                    'in_stock' => $availableStock > 0,

                    'available_stock' => $availableStock,
                ];
            });

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
            ->map(fn ($item) => $this->formatProduct($item));

        return [
            'success' => true,

            'message' => 'Lấy chi tiết sản phẩm thành công',

            'data' => [
                ...$this->formatProduct($product),

                'description' => $product->description,

                'images' => $product->images->map(fn ($image) => [
                    'url' => $image->url,
                    'type' => $image->type,
                ]),

                'variants' => $product->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'attributes' => $variant->attributes ?? [],
                    'original_price' => $variant->price,
                    'sale_price' => $variant->price,
                    'discount_amount' => 0,
                    'promotion' => null,
                    'sku' => $variant->sku,
                    'price' => $variant->price,
                    'stock' => $variant->stock,
                    'reserved_stock' => $variant->reserved_stock,
                    'sold_stock' => $variant->sold_stock,
                ]),

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
    // FORMAT PRODUCT (🔥 FE READY)
    // =========================
    public function formatProduct($product)
    {
        $availableStock = $product->variants->sum(function ($variant) {
            return max(0, $variant->stock - $variant->reserved_stock);
        });

        $sold = $product->variants->sum('sold_stock');

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,

            'price_min' => $product->variants->min('price'),
            'price_max' => $product->variants->max('price'),

            'thumbnail' => optional(
                $product->images
                    ->where('type','thumbnail')
                    ->first()
            )->url

            ?? optional(
                $product->images->first()
            )->url

            ?? 'https://placehold.co/600x600?text=CTU',

            'images' => $product->images->map(fn($image) => [
                'url' => $image->url,
                'type' => $image->type,
            ]),

            'rating' => (float) $product->average_rating,
            'average_rating' => (float) $product->average_rating,
            'review_count' => $product->total_reviews,

            'sold' => $sold,
            'stock' => $availableStock,
            'in_stock' => $availableStock > 0,

            'is_featured' => (bool) $product->is_featured,
            'is_active' => (bool) $product->is_active,

            'category' => [
                'id'=>$product->category?->id,
                'name'=>$product->category?->name,
                'slug'=>$product->category?->slug,
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
                ->map(function ($item) {
                    return $this->formatProduct(
                        $item->product
                    );
                })
                ->values(),
        ];
    }
}