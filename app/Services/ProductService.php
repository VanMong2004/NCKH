<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Category;

class ProductService
{
    const MAX_PAGE_SIZE = 50;

    // =========================
    // LIST + FILTER
    // =========================
    public function getList($filters)
    {
        $pageSize = min($filters['page_size'] ?? 10, self::MAX_PAGE_SIZE);

        $query = Product::query()
            ->with(['images', 'variants'])
            ->where('is_active', true);

        // =========================
        // KEYWORD
        // =========================
        if (!empty($filters['keyword'])) {
            $query->where('name', 'like', '%' . $filters['keyword'] . '%');
        }

        // =========================
        // CATEGORY TREE
        // =========================
        if (!empty($filters['category_id'])) {
            $categoryIds = $this->getAllChildCategoryIds($filters['category_id']);
            $query->whereIn('category_id', $categoryIds);
        }

        // =========================
        // PRICE FILTER
        // =========================
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

        // =========================
        // SORT
        // =========================
        switch ($filters['sort'] ?? 'newest') {
            case 'price_asc':
                $query->withMin('variants', 'price')
                    ->orderBy('variants_min_price', 'asc');
                break;

            case 'price_desc':
                $query->withMin('variants', 'price')
                    ->orderBy('variants_min_price', 'desc');
                break;

            case 'rating':
                $query->orderBy('avg_rating', 'desc');
                break;

            default:
                $query->latest();
        }

        $products = $query->paginate($pageSize);

        // 🔥 format lại cho FE
        /** @var \Illuminate\Pagination\LengthAwarePaginator $products */
        $products->getCollection()->transform(function ($product) {
            return $this->formatProduct($product);
        });

        return [
            'success' => true,
            'data' => $products
        ];
    }

    // =========================
    // DETAIL
    // =========================
    public function getDetail($id)
    {
        $product = Product::with([
            'images',
            'variants',
            'reviews.user:id,name,avatar'
        ])->findOrFail($id);

        return [
            'success' => true,
            'data' => [
                ...$this->formatProduct($product),
                'variants_grouped' => $this->groupVariants($product->variants),
                'reviews' => $product->reviews
            ]
        ];
    }

    // =========================
    // VARIANTS
    // =========================
    public function getVariants($productId)
    {
        $product = Product::with('variants')->findOrFail($productId);

        return [
            'success' => true,
            'data' => $this->groupVariants($product->variants)
        ];
    }

    // =========================
    // REVIEWS
    // =========================
    public function getReviews($productId)
    {
        $reviews = Product::findOrFail($productId)
            ->reviews()
            ->with('user:id,name,avatar')
            ->latest()
            ->get();

        return [
            'success' => true,
            'data' => $reviews
        ];
    }

    // =========================
    // FORMAT PRODUCT (🔥 FE READY)
    // =========================
    private function formatProduct($product)
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,

            'price_min' => $product->variants->min('price'),
            'price_max' => $product->variants->max('price'),

            'thumbnail' => optional(
                $product->images->where('type', 'thumbnail')->first()
            )->url,

            'images' => $product->images->pluck('url'),

            'rating' => $product->avg_rating,
            'review_count' => $product->review_count,
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
}