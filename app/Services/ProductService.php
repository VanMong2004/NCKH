<?php

namespace App\Services;

use App\Models\Product;
use App\Models\AnalyticsDailyMetric;
use App\Models\Category;
use App\Models\ProductVariant;
use App\Models\Department;
use App\Models\RecentlyViewedProduct;
use App\Models\Review;
use RuntimeException;
use App\Services\PromotionPriceService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;


class ProductService
{
    public function __construct(
        protected PromotionPriceService $promotionPriceService
    ) {}

    private const MAX_PAGE_SIZE = 50;
    private const RELATED_PRODUCTS_LIMIT = 8;
    private const FILTER_META_CACHE_MINUTES = 5;
    private const PRODUCT_VIEW_TTL_MINUTES = 30;

    // LIST + FILTER
    public function getList(array $filters = [], $user = null)
    {
        $perPage = min(
            $filters['per_page'] ?? 10,
            self::MAX_PAGE_SIZE
        );

        $query = Product::query()
            ->with([
                'thumbnailImage:id,product_id,url,type,position',
                'primaryImage:id,product_id,url,type,position',
                'variants' => function ($q) {
                    $q->select([
                        'id',
                        'product_id',
                        'size',
                        'color',
                        'price',
                        'stock',
                        'reserved_stock',
                        'sold_stock',
                        'is_active',
                    ])->where('is_active', true);
                },
                'category:id,parent_id,name,slug',
                'department:id,name,slug,code',
            ])
            ->where('is_active', true)
            ->whereHas('variants', function ($q) {
                $q->where('is_active', true)
                    ->whereRaw('(stock - reserved_stock) > 0');
            });

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $words = collect(preg_split('/\s+/', $keyword))
                ->map(fn ($word) => trim($word))
                ->filter(fn ($word) => mb_strlen($word) >= 3)
                ->unique()
                ->values();

            $query->where(function ($q) use ($keyword, $words) {
                // Tìm đúng cụm
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%")

                    // Tìm theo danh mục trực tiếp
                    ->orWhereHas('category', function ($categoryQuery) use ($keyword) {
                        $categoryQuery->where('name', 'like', "%{$keyword}%")
                            ->orWhere('slug', 'like', "%{$keyword}%");
                    })

                    // Tìm theo danh mục cha
                    ->orWhereHas('category.parent', function ($parentQuery) use ($keyword) {
                        $parentQuery->where('name', 'like', "%{$keyword}%")
                            ->orWhere('slug', 'like', "%{$keyword}%");
                    });

                // Chỉ tìm từng từ trong tên sản phẩm, không tìm trong description
                foreach ($words as $word) {
                    $q->orWhere('name', 'like', "%{$word}%");
                }
            });
        }

        if (!empty($filters['category_id'])) {
            $categoryIds = $this->getAllChildCategoryIds($filters['category_id']);

            $query->whereIn('category_id', $categoryIds);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['min_price']) || !empty($filters['max_price'])) {
            $query->whereHas('variants', function ($q) use ($filters) {
                $q->where('is_active', true);
                
                if (!empty($filters['min_price'])) {
                    $q->where('price', '>=', $filters['min_price']);
                }

                if (!empty($filters['max_price'])) {
                    $q->where('price', '<=', $filters['max_price']);
                }
            });
        }

        if (!empty($filters['sizes'])) {
            $sizes = is_array($filters['sizes'])
                ? $filters['sizes']
                : explode(',', $filters['sizes']);

            $query->whereHas('variants', function ($q) use ($sizes) {
                $q->where('is_active', true)
                    ->whereIn('size', $sizes);
            });
        }

        if (!empty($filters['colors'])) {
            $colors = is_array($filters['colors'])
                ? $filters['colors']
                : explode(',', $filters['colors']);

            $query->whereHas('variants', function ($q) use ($colors) {
                $q->where('is_active', true)
                    ->whereIn('color', $colors);
            });
        }

        if (!empty($filters['rating'])) {
            $query->where('average_rating', '>=', $filters['rating']);
        }

        if (!empty($filters['in_stock'])) {
            $query->whereHas('variants', function ($q) {
                $q->where('is_active', true)
                    ->whereRaw('(stock - reserved_stock) > 0');
            });
        }

        switch ($filters['sort'] ?? 'newest') {
            case 'oldest':
                $query->oldest();
                break;

            case 'price_asc':
                $query->withMin(['variants as active_min_price' => function ($q) {
                    $q->where('is_active', true);
                }], 'price')->orderBy('active_min_price', 'asc');
                break;

            case 'price_desc':
                $query->withMax(['variants as active_max_price' => function ($q) {
                    $q->where('is_active', true);
                }], 'price')->orderBy('active_max_price', 'desc');
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

        $products = $query->paginate($perPage);

        $data = collect($products->items())
            ->map(function ($product) use ($user) {
                return $this->formatProductSummary($product, $user);
            })
            ->values();

        $filterMeta = $this->filterMeta();

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

    private function filterMeta(): array
    {
        return Cache::remember(
            'products:filter_meta:v1',
            now()->addMinutes(self::FILTER_META_CACHE_MINUTES),
            function () {
                $allVariants = ProductVariant::query()
                    ->where('is_active', true)
                    ->whereHas('product', function ($q) {
                        $q->where('is_active', true);
                    });

                return [
                    'sizes' => (clone $allVariants)
                        ->select('size')
                        ->whereNotNull('size')
                        ->distinct()
                        ->pluck('size'),

                    'colors' => (clone $allVariants)
                        ->select('color')
                        ->whereNotNull('color')
                        ->distinct()
                        ->pluck('color'),

                    'price_range' => [
                        'min' => (clone $allVariants)->min('price'),
                        'max' => (clone $allVariants)->max('price'),
                    ],

                    'departments' => Department::query()
                        ->select(['id', 'name', 'slug', 'code', 'sort_order'])
                        ->where('is_active', true)
                        ->orderBy('sort_order')
                        ->orderBy('name')
                        ->get()
                        ->map(fn ($department) => [
                            'id' => $department->id,
                            'name' => $department->name,
                            'slug' => $department->slug,
                            'code' => $department->code,
                        ]),

                    'categories' => Category::query()
                        ->select(['id', 'name', 'slug', 'parent_id'])
                        ->whereNull('parent_id')
                        ->with([
                            'children' => fn ($q) => $q->select(['id', 'name', 'slug', 'parent_id']),
                        ])
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
            }
        );
    }

    // DETAIL
    public function show(string $slug, $user = null)
    {
        $product = Product::query()
            ->with([
                'images:id,product_id,url,type,position',
                'variants' => function ($q) {
                    $q->select([
                        'id',
                        'product_id',
                        'size',
                        'color',
                        'sku',
                        'price',
                        'stock',
                        'reserved_stock',
                        'sold_stock',
                        'is_active',
                    ])->where('is_active', true);
                },
                'category:id,parent_id,name,slug',
                'category.parent:id,parent_id,name,slug',
                'department:id,name,slug,code',
                'reviews' => function ($q) {
                    $q->select([
                        'id',
                        'product_id',
                        'user_id',
                        'rating',
                        'comment',
                        'created_at',
                    ])->latest()->limit(10);
                },
                'reviews.user:id,name,avatar',
            ])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            throw new RuntimeException('Sản phẩm không tồn tại');
        }

        $this->incrementProductView($product, $user);

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

        $relatedProducts = Product::query()
            ->with([
                'thumbnailImage:id,product_id,url,type,position',
                'primaryImage:id,product_id,url,type,position',
                'variants' => function ($q) {
                    $q->select([
                        'id',
                        'product_id',
                        'size',
                        'color',
                        'price',
                        'stock',
                        'reserved_stock',
                        'sold_stock',
                        'is_active',
                    ])->where('is_active', true);
                },
                'category:id,parent_id,name,slug',
                'department:id,name,slug,code',
            ])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->whereHas('variants', function ($q) {
                $q->where('is_active', true)
                    ->whereRaw('(stock - reserved_stock) > 0');
            })
            ->withSum(['variants as active_sold_stock' => function ($q) {
                $q->where('is_active', true);
            }], 'sold_stock')
            ->orderByDesc('active_sold_stock')
            ->orderByDesc('average_rating')
            ->latest()
            ->limit(self::RELATED_PRODUCTS_LIMIT)
            ->get()
            ->map(fn ($item) => $this->formatProductSummary($item, $user));

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

    // VARIANTS
    public function getVariants($productId)
    {
        $product = Product::with([
                'variants' => function ($q) {
                    $q->where('is_active', true);
                },
            ])
            ->where('is_active', true)
            ->find($productId);

        if (!$product) {
            throw new RuntimeException('Sản phẩm không tồn tại');
        }

        return [
            'success' => true,
            'data' => $this->groupVariants($product->variants),
        ];
    }

    // REVIEWS
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

    private function incrementProductView(Product $product, $user = null): void
    {
        $cacheKey = $this->productViewCacheKey($product, $user);

        if (!$cacheKey || Cache::has($cacheKey)) {
            return;
        }

        $product->increment('view_count');
        $product->view_count = (int) ($product->view_count ?? 0) + 1;

        AnalyticsDailyMetric::firstOrCreate([
            'metric_date' => now()->toDateString(),
        ])->increment('product_views_count');

        app(\App\Services\Analytics\AnalyticsEventService::class)
            ->broadcastDashboardRefresh();

        Cache::put(
            $cacheKey,
            true,
            now()->addMinutes(self::PRODUCT_VIEW_TTL_MINUTES)
        );
    }

    private function productViewCacheKey(Product $product, $user = null): ?string
    {
        if ($user?->id) {
            return "product_view:{$product->id}:user:{$user->id}";
        }

        $request = request();
        $guestToken = $request?->header('X-Guest-Token');

        if ($guestToken) {
            return "product_view:{$product->id}:guest:{$guestToken}";
        }

        $ipAddress = $request?->ip();
        $userAgent = (string) $request?->userAgent();

        if (!$ipAddress && $userAgent === '') {
            return null;
        }

        return 'product_view:'
            . $product->id
            . ':fingerprint:'
            . sha1($ipAddress . '|' . $userAgent);
    }

    // FORMAT PRODUCT
    public function formatProduct($product, $user = null)
    {
        $product->loadMissing('images');

        $summary = $this->productSummaryValues($product, $user);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,

            'min_price' => $summary['min_price'],
            'max_price' => $summary['max_price'],

            'original_min_price' => $summary['original_min_price'],
            'original_max_price' => $summary['original_max_price'],

            'promotion_min_price' => $summary['promotion_min_price'],
            'promotion_max_price' => $summary['promotion_max_price'],

            'has_promotion' => $summary['has_promotion'],
            'promotion_login_required' => $summary['promotion_login_required'],

            'thumbnail' => $this->productThumbnail($product),

            'images' => $product->images->map(fn ($image) => [
                'url' => $image->url,
                'type' => $image->type,
            ]),

            'rating' => (float) $product->average_rating,
            'average_rating' => (float) $product->average_rating,
            'review_count' => $product->total_reviews,
            'total_reviews' => $product->total_reviews,

            'sold' => $summary['sold'],
            'view_count' => (int) ($product->view_count ?? 0),
            'stock' => $summary['available_stock'],
            'available_stock' => $summary['available_stock'],
            'in_stock' => $summary['available_stock'] > 0,

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

            'department' => $product->department
                ? [
                    'id' => $product->department->id,
                    'name' => $product->department->name,
                    'slug' => $product->department->slug,
                    'code' => $product->department->code,
                ]
                : null,

            'image_url' => $this->absoluteImageUrl(
                optional(
                    $product->images
                        ->where('type', 'thumbnail')
                        ->first()
                )->url
                ?? optional($product->images->first())->url
            ),

            'product_url' => url('/product/' . $product->slug),

            'product_slug' => $product->slug,

            'category_name' => $product->category?->name,

            'description' => Str::limit(strip_tags($product->description), 150),
        ];
    }

    public function formatProductSummary($product, $user = null): array
    {
        $summary = $this->productSummaryValues($product, $user);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,

            'min_price' => $summary['min_price'],
            'max_price' => $summary['max_price'],
            'original_min_price' => $summary['original_min_price'],
            'original_max_price' => $summary['original_max_price'],
            'promotion_min_price' => $summary['promotion_min_price'],
            'promotion_max_price' => $summary['promotion_max_price'],
            'has_promotion' => $summary['has_promotion'],
            'promotion_login_required' => $summary['promotion_login_required'],

            'thumbnail' => $this->productThumbnail($product),

            'rating' => (float) $product->average_rating,
            'average_rating' => (float) $product->average_rating,
            'review_count' => $product->total_reviews,
            'total_reviews' => $product->total_reviews,

            'sold' => $summary['sold'],
            'view_count' => (int) ($product->view_count ?? 0),
            'stock' => $summary['available_stock'],
            'available_stock' => $summary['available_stock'],
            'in_stock' => $summary['available_stock'] > 0,

            'is_featured' => (bool) $product->is_featured,
            'is_active' => (bool) $product->is_active,

            'category' => [
                'id' => $product->category?->id,
                'name' => $product->category?->name,
                'slug' => $product->category?->slug,
            ],

            'department' => $product->department
                ? [
                    'id' => $product->department->id,
                    'name' => $product->department->name,
                    'slug' => $product->department->slug,
                    'code' => $product->department->code,
                ]
                : null,

            'product_slug' => $product->slug,
            'category_name' => $product->category?->name,
        ];
    }

    // GROUP VARIANTS (🔥 UI)
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

    // CATEGORY TREE
    private function getAllChildCategoryIds($categoryId)
    {
        $ids = [$categoryId];

        $children = Category::where('parent_id', $categoryId)->pluck('id');

        foreach ($children as $childId) {
            $ids = array_merge($ids, $this->getAllChildCategoryIds($childId));
        }

        return $ids;
    }

    // RECENTLY VIEWED PRODUCTS
    public function recentlyViewed($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        $items = RecentlyViewedProduct::query()
            ->with([
                'product.thumbnailImage:id,product_id,url,type,position',
                'product.primaryImage:id,product_id,url,type,position',
                'product.variants' => function ($q) {
                    $q->select([
                        'id',
                        'product_id',
                        'size',
                        'color',
                        'price',
                        'stock',
                        'reserved_stock',
                        'sold_stock',
                        'is_active',
                    ])->where('is_active', true);
                },
                'product.category:id,parent_id,name,slug',
                'product.department:id,name,slug,code',
            ])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->orderByDesc('viewed_at')
            ->limit(20)
            ->get();

        return [
            'success' => true,

            'message' => 'Lấy recently viewed thành công',

            'data' => $items
                ->filter(fn ($item) =>
                    $item->product
                    && $item->product->is_active
                    && $item->product->variants->isNotEmpty()
                )
                ->map(function ($item) use ($user) {
                    return $this->formatProductSummary(
                        $item->product,
                        $user
                    );
                })
                ->values(),
        ];
    }

    private function absoluteImageUrl(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        if (
            str_starts_with($url, 'http://') ||
            str_starts_with($url, 'https://')
        ) {
            return $url;
        }

        return asset(ltrim($url, '/'));
    }

    private function productSummaryValues($product, $user = null): array
    {
        $availableStock = $product->variants->sum(function ($variant) {
            return max(0, $variant->stock - $variant->reserved_stock);
        });

        $variantPrices = $product->variants
            ->map(function ($variant) use ($user) {
                return $this->promotionPriceService
                    ->calculateForVariant($variant, $user);
            });

        $promotionPrices = $variantPrices
            ->filter(fn ($item) => !is_null($item['promotion_price']));

        return [
            'min_price' => $variantPrices->min('final_price'),
            'max_price' => $variantPrices->max('final_price'),
            'original_min_price' => $variantPrices->min('original_price'),
            'original_max_price' => $variantPrices->max('original_price'),
            'promotion_min_price' => $promotionPrices->min('promotion_price'),
            'promotion_max_price' => $promotionPrices->max('promotion_price'),
            'has_promotion' => $variantPrices->contains(fn ($item) => $item['has_promotion']),
            'promotion_login_required' => $variantPrices->contains(fn ($item) => $item['promotion_login_required']),
            'sold' => $product->variants->sum('sold_stock'),
            'available_stock' => $availableStock,
        ];
    }

    private function productThumbnail($product): string
    {
        $thumbnail = $product->relationLoaded('thumbnailImage')
            ? $product->thumbnailImage?->url
            : null;

        $primary = $product->relationLoaded('primaryImage')
            ? $product->primaryImage?->url
            : null;

        $imageFromCollection = null;

        if ($product->relationLoaded('images')) {
            $imageFromCollection = optional(
                $product->images
                    ->where('type', 'thumbnail')
                    ->first()
            )->url
                ?? optional($product->images->first())->url;
        }

        return $thumbnail
            ?? $primary
            ?? $imageFromCollection
            ?? 'https://placehold.co/600x600?text=CTU';
    }
}
