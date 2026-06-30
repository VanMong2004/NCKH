<?php

namespace App\Services\Admin;

use RuntimeException;
use App\Models\Review;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminReviewService
{
    public function index(array $filters = []): array
    {
        $query = Review::query()
            ->with([
                'user:id,name,email,avatar',
                'product:id,name,slug',
                'order:id,order_code,status',
                'images',
            ]);

        if (($filters['status'] ?? null) === 'deleted') {
            $query->onlyTrashed();
        } elseif (($filters['status'] ?? null) === 'all') {
            $query->withTrashed();
        } else {
            $query->whereNull('deleted_at');

            if (($filters['status'] ?? null) === 'visible') {
                $query->where('is_active', true);
            }

            if (($filters['status'] ?? null) === 'hidden') {
                $query->where('is_active', false);
            }
        }

        if (!empty($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['rating'])) {
            $query->where('rating', $filters['rating']);
        }

        if (!empty($filters['keyword'])) {
            $keyword = $filters['keyword'];

            $query->where(function ($q) use ($keyword) {
                $q->where('comment', 'like', "%{$keyword}%")
                    ->orWhereHas('user', function ($u) use ($keyword) {
                        $u->where('name', 'like', "%{$keyword}%")
                            ->orWhere('email', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('product', function ($p) use ($keyword) {
                        $p->where('name', 'like', "%{$keyword}%")
                            ->orWhere('slug', 'like', "%{$keyword}%");
                    });
            });
        }

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        switch ($filters['sort'] ?? 'latest') {
            case 'oldest':
                $query->oldest();
                break;

            case 'highest':
                $query->orderByDesc('rating');
                break;

            case 'lowest':
                $query->orderBy('rating');
                break;

            default:
                $query->latest();
                break;
        }

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);

        $reviews = $query->paginate($perPage);

        $reviews->setCollection(
            $reviews->getCollection()
                ->map(fn ($review) => $this->formatReview($review))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách review thành công',
            'data' => $reviews,
        ];
    }

    public function statistics(): array
    {
        $visibleQuery = Review::query()
            ->where('is_active', true);

        return [
            'success' => true,
            'message' => 'Lấy thống kê review thành công',
            'data' => [
                'total_reviews' => Review::count(),

                'visible_reviews' => Review::where('is_active', true)->count(),

                'hidden_reviews' => Review::where('is_active', false)
                    ->whereNull('deleted_at')
                    ->count(),

                'deleted_reviews' => Review::onlyTrashed()->count(),

                'average_rating' => round(
                    (float) $visibleQuery->avg('rating'),
                    2
                ),

                'rating_breakdown' => [
                    5 => Review::where('is_active', true)->where('rating', 5)->count(),
                    4 => Review::where('is_active', true)->where('rating', 4)->count(),
                    3 => Review::where('is_active', true)->where('rating', 3)->count(),
                    2 => Review::where('is_active', true)->where('rating', 2)->count(),
                    1 => Review::where('is_active', true)->where('rating', 1)->count(),
                ],

                'low_rating_reviews' => Review::where('is_active', true)
                    ->whereIn('rating', [1, 2])
                    ->count(),

                'top_reviewed_products' => $this->topReviewedProducts(),
                'lowest_rated_products' => $this->lowestRatedProducts(),
            ],
        ];
    }

    public function show(int $id): array
    {
        $review = Review::withTrashed()
            ->with([
                'user:id,name,email,avatar',
                'product:id,name,slug',
                'order:id,order_code,status',
                'images',
            ])
            ->find($id);

        if (!$review) {
            throw new RuntimeException('Review không tồn tại', 404);
        }

        return [
            'success' => true,
            'message' => 'Lấy chi tiết review thành công',
            'data' => $this->formatReview($review),
        ];
    }

    public function hide(int $id): array
    {
        return DB::transaction(function () use ($id) {
            $review = Review::with('product')->find($id);

            if (!$review) {
                throw new RuntimeException('Review không tồn tại', 404);
            }

            if (!$review->is_active) {
                throw new RuntimeException('Review này đã bị ẩn', 400);
            }

            $review->update([
                'is_active' => false,
            ]);

            if ($review->product) {
                $this->recalculateProductRating($review->product);
            }

            return [
                'success' => true,
                'message' => 'Ẩn review thành công',
                'data' => $this->formatReview($review->fresh([
                    'user:id,name,email,avatar',
                    'product:id,name,slug',
                    'order:id,order_code,status',
                    'images',
                ])),
            ];
        });
    }

    public function showReview(int $id): array
    {
        return DB::transaction(function () use ($id) {
            $review = Review::with('product')->find($id);

            if (!$review) {
                throw new RuntimeException('Review không tồn tại', 404);
            }

            if ($review->is_active) {
                throw new RuntimeException('Review này đang hiển thị', 400);
            }

            $review->update([
                'is_active' => true,
            ]);

            if ($review->product) {
                $this->recalculateProductRating($review->product);
            }

            return [
                'success' => true,
                'message' => 'Hiển thị review thành công',
                'data' => $this->formatReview($review->fresh([
                    'user:id,name,email,avatar',
                    'product:id,name,slug',
                    'order:id,order_code,status',
                    'images',
                ])),
            ];
        });
    }

    public function destroy(int $id): array
    {
        return DB::transaction(function () use ($id) {
            $review = Review::with([
                'product',
                'images',
            ])->find($id);

            if (!$review) {
                throw new RuntimeException('Review không tồn tại', 404);
            }

            $product = $review->product;

            $review->update([
                'is_active' => false,
            ]);

            $review->delete();

            if ($product) {
                $this->recalculateProductRating($product);
            }

            return [
                'success' => true,
                'message' => 'Xóa review thành công',
                'data' => null,
            ];
        });
    }

    private function recalculateProductRating(Product $product): void
    {
        $average = Review::where('product_id', $product->id)
            ->where('is_active', true)
            ->avg('rating');

        $total = Review::where('product_id', $product->id)
            ->where('is_active', true)
            ->count();

        $product->update([
            'average_rating' => round($average ?? 0, 2),
            'total_reviews' => $total,
        ]);
    }

    private function topReviewedProducts(): array
    {
        return Review::query()
            ->select([
                'products.id',
                'products.name',
                'products.slug',
                DB::raw('COUNT(reviews.id) as reviews_count'),
                DB::raw('ROUND(AVG(reviews.rating), 2) as average_rating'),
            ])
            ->join('products', 'products.id', '=', 'reviews.product_id')
            ->where('reviews.is_active', true)
            ->groupBy([
                'products.id',
                'products.name',
                'products.slug',
            ])
            ->orderByDesc('reviews_count')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'reviews_count' => (int) $item->reviews_count,
                'average_rating' => (float) $item->average_rating,
            ])
            ->toArray();
    }

    private function lowestRatedProducts(): array
    {
        return Review::query()
            ->select([
                'products.id',
                'products.name',
                'products.slug',
                DB::raw('COUNT(reviews.id) as reviews_count'),
                DB::raw('ROUND(AVG(reviews.rating), 2) as average_rating'),
            ])
            ->join('products', 'products.id', '=', 'reviews.product_id')
            ->where('reviews.is_active', true)
            ->groupBy([
                'products.id',
                'products.name',
                'products.slug',
            ])
            ->havingRaw('COUNT(reviews.id) >= 1')
            ->orderBy('average_rating')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'reviews_count' => (int) $item->reviews_count,
                'average_rating' => (float) $item->average_rating,
            ])
            ->toArray();
    }

    private function formatReview(Review $review): array
    {
        return [
            'id' => $review->id,
            'order_id' => $review->order_id,
            'order_code' => $review->order?->order_code,

            'rating' => (int) $review->rating,
            'comment' => $review->comment,

            'is_active' => (bool) $review->is_active,
            'is_deleted' => !is_null($review->deleted_at),

            'product' => $review->product ? [
                'id' => $review->product->id,
                'name' => $review->product->name,
                'slug' => $review->product->slug,
            ] : null,

            'user' => $review->user ? [
                'id' => $review->user->id,
                'name' => $review->user->name,
                'email' => $review->user->email,
                'avatar' => $review->user->avatar_url,
            ] : null,

            'images' => $review->images
                ? $review->images->pluck('image_url')->values()
                : [],

            'created_at' => optional($review->created_at)->format('d/m/Y H:i'),
            'deleted_at' => optional($review->deleted_at)->format('d/m/Y H:i'),
        ];
    }
}
