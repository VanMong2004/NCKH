<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ReviewService
{
    /*
    |--------------------------------------------------------------------------
    | CREATE REVIEW
    |--------------------------------------------------------------------------
    */

    public function create($user, array $data)
    {
        return DB::transaction(function () use ($user, $data) {

            $product = Product::findOrFail($data['product_id']);

            /*
            |--------------------------------------------------------------------------
            | CHECK PURCHASED + COMPLETED ORDER
            |--------------------------------------------------------------------------
            */

            $completedOrder = Order::query()
                ->where('user_id', $user->id)
                ->where('status', 'paid')
                ->whereHas('items.productVariant', function ($q) use ($data) {
                    $q->where(
                        'product_id',
                        $data['product_id']
                    );
                })
                ->latest()
                ->first();

            if (!$completedOrder) {

                throw new \Exception(
                    'Chỉ được đánh giá sản phẩm đã mua'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK EXISTING REVIEW
            |--------------------------------------------------------------------------
            */

            $exists = Review::where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->exists();

            if ($exists) {
                throw new \Exception(
                    'Bạn đã review sản phẩm này'
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

    public function update($user, Review $review, array $data)
    {
        if ($review->user_id !== $user->id) {
            throw new \Exception(
                'Bạn không có quyền sửa review này'
            );
        }

        return DB::transaction(function () use (
            $review,
            $data,
            $user
        ) {

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

            $this->recalculateProductRating(
                $review->product
            );

            return $this->formatReview(
                $review->load('images', 'user', 'product')
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE REVIEW
    |--------------------------------------------------------------------------
    */

    public function delete($user, Review $review)
    {
        if ($review->user_id !== $user->id) {
            throw new \Exception(
                'Bạn không có quyền xóa review này'
            );
        }

        return DB::transaction(function () use ($review) {

            $product = $review->product;

            $this->deleteImages($review);

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

    public function listByProduct(Product $product, array $filters)
    {
        $query = Review::with([
                'user',
                'images'
            ])
            ->where('product_id', $product->id);

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

        $perPage = $filters['per_page'] ?? 10;

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
                'current_page'
                    => $reviews->currentPage(),

                'last_page'
                    => $reviews->lastPage(),

                'per_page'
                    => $reviews->perPage(),

                'total'
                    => $reviews->total(),
            ]
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
            ->avg('rating');

        $total = Review::where('product_id', $product->id)
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

        $directory = resource_path(
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

                'image_url'
                    => url(
                        '/api/images/reviews/'
                        . $relativePath
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
                url('/api/images/reviews/') . '/',
                '',
                $image->image_url
            );

            $fullPath = resource_path(
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