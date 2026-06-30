<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;

class ReviewService
{
    /*
    |--------------------------------------------------------------------------
    | CREATE REVIEW
    |--------------------------------------------------------------------------
    */

    public function create($user, array $data)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        return DB::transaction(function () use ($user, $data) {
            $product = Product::find($data['product_id']);

            if (!$product) {
                throw new RuntimeException('Sản phẩm không tồn tại', 404);
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK PURCHASED + COMPLETED ORDER
            |--------------------------------------------------------------------------
            */

            $completedOrder = Order::query()
                ->where('id', $data['order_id'])
                ->where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereHas('items.productVariant', function ($q) use ($data) {
                    $q->where('product_id', $data['product_id']);
                })
                ->first();

            if (!$completedOrder) {
                throw new RuntimeException(
                    'Chỉ được đánh giá sản phẩm đã mua',
                    403
                );
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK EXISTING REVIEW
            |--------------------------------------------------------------------------
            */

            $exists = Review::where('order_id', $completedOrder->id)
                ->where('product_id', $product->id)
                ->where('is_active', true)
                ->exists();

            if ($exists) {
                throw new RuntimeException(
                    'Bạn đã review sản phẩm này trong đơn hàng này',
                    409
                );
            }

            /*
            |--------------------------------------------------------------------------
            | CREATE REVIEW
            |--------------------------------------------------------------------------
            */

            $review = Review::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'order_id' => $completedOrder->id,
                'rating' => $data['rating'],
                'comment' => $data['comment'],
                'is_active' => true,
            ]);

            /*
            |--------------------------------------------------------------------------
            | UPLOAD IMAGES
            |--------------------------------------------------------------------------
            */

            if (!empty($data['images'])) {
                $this->uploadImages(
                    $review,
                    $data['images'],
                    $product,
                    $user
                );
            }

            /*
            |--------------------------------------------------------------------------
            | RECALCULATE PRODUCT RATING
            |--------------------------------------------------------------------------
            */

            $this->recalculateProductRating($product);

            return $this->formatReview(
                $review->load('images', 'user', 'product')
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE REVIEW
    |--------------------------------------------------------------------------
    */

    public function update($user, $reviewId, array $data)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }        

        $review = Review::with([
            'images',
            'user',
            'product',
            'order',
        ])->find($reviewId);

        if (!$review) {
            throw new RuntimeException('Review không tồn tại', 404);
        }

        if ((int) $review->user_id !== (int) $user->id) {
            throw new RuntimeException(
                'Bạn không có quyền sửa review này',
                403
            );
        }

        if (!$review->order || $review->order->status !== 'completed') {
            throw new RuntimeException(
                'Chỉ được cập nhật review của đơn hàng đã hoàn tất',
                403
            );
        }

        return DB::transaction(function () use ($review, $data, $user) {
            $review->update([
                'rating' => $data['rating'],
                'comment' => $data['comment'],
            ]);

            /*
            |--------------------------------------------------------------------------
            | REPLACE IMAGES
            |--------------------------------------------------------------------------
            */

            if (!empty($data['images'])) {
                $this->deleteImages($review);

                $this->uploadImages(
                    $review,
                    $data['images'],
                    $review->product,
                    $user
                );
            }

            /*
            |--------------------------------------------------------------------------
            | RECALCULATE PRODUCT RATING
            |--------------------------------------------------------------------------
            */

            $this->recalculateProductRating(
                $review->product
            );

            return $this->formatReview(
                $review->load('images', 'user', 'product', 'order')
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE REVIEW
    |--------------------------------------------------------------------------
    */

    public function delete($user, $reviewId)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $review = Review::with([
            'images',
            'product',
        ])->find($reviewId);

        if (!$review) {
            throw new RuntimeException('Review không tồn tại', 404);
        }

        if ((int) $review->user_id !== (int) $user->id) {
            throw new RuntimeException(
                'Bạn không có quyền xóa review này',
                403
            );
        }

        if (!$review->product) {
            throw new RuntimeException(
                'Sản phẩm của review không tồn tại',
                404
            );
        }

        return DB::transaction(function () use ($review) {
            $product = $review->product;

            $this->deleteImages($review);

            $review->update([
                'is_active' => false,
            ]);

            $review->delete();

            $this->recalculateProductRating($product);

            return true;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | LIST PRODUCT REVIEWS
    |--------------------------------------------------------------------------
    */

    public function listByProduct($productId, array $filters)
    {
        $product = Product::find($productId);

        if (!$product) {
            throw new RuntimeException('Sản phẩm không tồn tại', 404);
        }

        $query = Review::with([
            'user',
            'images',
        ])
        ->where('product_id', $product->id)
        ->where('is_active', true);

        /*
        |--------------------------------------------------------------------------
        | FILTER RATING
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['rating'])) {
            $query->where('rating', $filters['rating']);
        }

        /*
        |--------------------------------------------------------------------------
        | SORT
        |--------------------------------------------------------------------------
        */

        switch ($filters['sort'] ?? 'latest') {
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

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 50);

        $reviews = $query->paginate($perPage);

        /*
        |--------------------------------------------------------------------------
        | RATING BREAKDOWN
        |--------------------------------------------------------------------------
        */

        $breakdown = [];

        for ($i = 1; $i <= 5; $i++) {
            $breakdown[$i] = Review::where(
                'product_id',
                $product->id
            )
                ->where('is_active', true)
                ->where('rating', $i)
                ->count();
        }

        return [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
            ],

            'average_rating' => (float) $product->average_rating,

            'total_reviews' => (int) $product->total_reviews,

            'rating_breakdown' => $breakdown,

            'data' => collect($reviews->items())
                ->map(fn ($review) => $this->formatReview($review))
                ->values(),

            'meta' => [
                'current_page' => $reviews->currentPage(),

                'last_page' => $reviews->lastPage(),

                'per_page' => $reviews->perPage(),

                'total' => $reviews->total(),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | RECALCULATE PRODUCT RATING
    |--------------------------------------------------------------------------
    */

    protected function recalculateProductRating(Product $product)
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

    /*
    |--------------------------------------------------------------------------
    | UPLOAD IMAGES
    |--------------------------------------------------------------------------
    */

    protected function uploadImages(
        Review $review,
        array $images,
        Product $product,
        $user
    ) {

        $productSlug = Str::slug($product->name);

        $directory = public_path(
            'images/reviews/'
            . $productSlug
            . '/user-' . $user->id
        );

        if (!File::exists($directory)) {
            File::makeDirectory(
                $directory,
                0755,
                true
            );
        }

        foreach ($images as $index => $image) {

            $extension = $image->getClientOriginalExtension();

            $fileName =
                'review_' . $review->id
                . '_' . time()
                . '_' . $index
                . '.' . $extension;

            $image->move($directory, $fileName);

            $relativePath =
                $productSlug
                . '/user-' . $user->id
                . '/' . $fileName;

            ReviewImage::create([
                'review_id' => $review->id,

                'image_url' => url(
                    '/images/reviews/' . $relativePath
                ),
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE IMAGES
    |--------------------------------------------------------------------------
    */

    protected function deleteImages(Review $review)
    {
        foreach ($review->images as $image) {

            $relative = str_replace(
                url('/images/reviews/') . '/',
                '',
                $image->image_url
            );

            $fullPath = public_path(
                'images/reviews/' . $relative
            );

            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            $image->delete();
        }
    }

    private function formatReview($review)
    {
        return [
            'id' => $review->id,
            'order_id' => $review->order_id,
            'rating' => (int) $review->rating,
            'comment' => $review->comment,
            'product' => [
                'id' => $review->product?->id,
                'name' => $review->product?->name,
                'slug' => $review->product?->slug,
            ],
            'user' => [
                'id' => $review->user?->id,
                'name' => $review->user?->name,
                'avatar' => $review->user?->avatar_url,
            ],
            'images' => $review->images
                ->pluck('image_url')
                ->values(),
            'created_at' => optional($review->created_at)
                ->format('d/m/Y H:i'),
        ];
    }
}
