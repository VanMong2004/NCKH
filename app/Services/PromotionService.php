<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Promotion;
use RuntimeException;

class PromotionService
{
    public function __construct(
        protected PromotionPriceService $priceService,
        protected ProductService $productService
    ) {}

    public function index(array $filters = []): array
    {
        $query = Promotion::query()
            ->withCount('items')
            ->where('is_active', true)
            ->where('status', 'active');

        if (!empty($filters['keyword'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%' . $filters['keyword'] . '%')
                    ->orWhere('description', 'like', '%' . $filters['keyword'] . '%');
            });
        }

        if (!empty($filters['status'])) {
            match ($filters['status']) {
                'upcoming' => $query->where('start_date', '>', now()),
                'active' => $query
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now()),
                'ended' => $query->where('end_date', '<', now()),
                default => null,
            };
        } else {
            $query
                ->where('start_date', '<=', now())
                ->where('end_date', '>=', now());
        }

        match ($filters['sort'] ?? 'latest') {
            'ending_soon' => $query->orderBy('end_date'),
            'popular' => $query->withSum('items', 'sold_quantity')
                ->orderByDesc('items_sum_sold_quantity'),
            default => $query->latest(),
        };

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 50);

        $promotions = $query->paginate($perPage);

        $promotions->setCollection(
            $promotions->getCollection()
                ->map(fn ($promotion) => $this->formatCard($promotion))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách khuyến mãi thành công',
            'data' => $promotions->items(),
            'meta' => [
                'current_page' => $promotions->currentPage(),
                'last_page' => $promotions->lastPage(),
                'per_page' => $promotions->perPage(),
                'total' => $promotions->total(),
            ],
        ];
    }

    public function show(string $slug): array
    {
        $promotion = Promotion::with([
            'items' => function ($query) {
                $query->where('is_active', true);
            },
            'items.product.images',
            'items.productVariant',
        ])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->where('status', 'active')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        if (!$promotion) {
            throw new RuntimeException('Khuyến mãi không tồn tại');
        }

        return $this->formatDetail($promotion);
    }

    public function products(string $slug, array $filters = [], $user = null): array
    {
        $promotion = Promotion::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->where('status', 'active')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        if (!$promotion) {
            throw new RuntimeException('Khuyến mãi không tồn tại');
        }

        $productIds = $promotion->items()
            ->where('is_active', true)
            ->pluck('product_id')
            ->unique()
            ->values();

        $perPage = min(max((int) ($filters['per_page'] ?? 12), 1), 50);

        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category.parent',
            ])
            ->whereIn('id', $productIds)
            ->where('is_active', true)
            ->paginate($perPage);

        $products->setCollection(
            $products->getCollection()
                ->map(fn ($product) => $this->productService->formatProduct($product, $user))
        );

        return [
            'success' => true,
            'message' => 'Lấy sản phẩm khuyến mãi thành công',
            'promotion' => $this->formatCard($promotion),

            'promotion_items' => $promotion->items()
                ->where('is_active', true)
                ->get()
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'limit_quantity' => $item->limit_quantity,
                    'sold_quantity' => $item->sold_quantity,
                    'reserved_quantity' => $item->reserved_quantity,
                    'remaining_quantity' => is_null($item->limit_quantity)
                        ? null
                        : max(
                                0,
                                $item->limit_quantity
                                - $item->sold_quantity
                                - $item->reserved_quantity
                            ),
                ])
                ->values(),

            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ];
    }

    private function formatCard(Promotion $promotion): array
    {
        return [
            'id' => $promotion->id,
            'title' => $promotion->title,
            'slug' => $promotion->slug,
            'description' => $promotion->description,
            'banner' => $promotion->banner,
            'thumbnail' => $promotion->thumbnail,
            'discount_type' => $promotion->discount_type,
            'discount_value' => (float) $promotion->discount_value,
            'start_date' => optional($promotion->start_date)->format('d/m/Y H:i'),
            'end_date' => optional($promotion->end_date)->format('d/m/Y H:i'),
            'status' => $promotion->status,
            'computed_status' => $promotion->computed_status,
            'countdown_seconds' => $promotion->end_date
                ? now()->diffInSeconds($promotion->end_date, false)
                : null,
            'total_items' => $promotion->items_count ?? $promotion->items()->count(),
        ];
    }

    private function formatDetail(Promotion $promotion): array
    {
        return [
            ...$this->formatCard($promotion),

            'items' => $promotion->items
                ->map(function ($item) {
                    $product = $item->product;
                    $variant = $item->productVariant;

                    return [
                        'id' => $item->id,

                        'product' => $product ? [
                            'id' => $product->id,
                            'name' => $product->name,
                            'slug' => $product->slug,
                            'thumbnail' => optional(
                                $product->images?->where('type', 'thumbnail')->first()
                            )->url ?? optional($product->images?->first())->url,
                        ] : null,

                        'variant' => $variant ? [
                            'id' => $variant->id,
                            'sku' => $variant->sku,
                            'size' => $variant->size,
                            'color' => $variant->color,
                            'attributes' => $variant->attributes,
                            'price' => (float) $variant->price,
                        ] : null,

                        'discount_type' => $item->discount_type,
                        'discount_value' => $item->discount_value,
                        'limit_quantity' => $item->limit_quantity,
                        'sold_quantity' => $item->sold_quantity,
                        'reserved_quantity' => $item->reserved_quantity,
                        'remaining_quantity' => is_null($item->limit_quantity)
                            ? null
                            : max(
                                    0,
                                    $item->limit_quantity
                                    - $item->sold_quantity
                                    - $item->reserved_quantity
                                ),                        
                        'is_active' => $item->is_active,
                    ];
                })
                ->values(),
        ];
    }
}
