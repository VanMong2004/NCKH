<?php

namespace Database\Seeders;

use App\Models\Review;
use App\Models\ReviewImage;
use Illuminate\Database\Seeder;

class ReviewImageSeeder extends Seeder
{
    public function run(): void
    {
        $reviews = Review::with('product')
            ->orderBy('id')
            ->get();

        foreach ($reviews as $index => $review) {
            if (!$review->product) {
                continue;
            }

            if ($index % 2 !== 0) {
                continue;
            }

            $slug = $review->product->slug;
            $userId = $review->user_id;

            ReviewImage::create([
                'review_id' => $review->id,
                'image_url' => "images/reviews/{$slug}/user-{$userId}/review-1.jpg",
            ]);

            if ($index % 4 === 0) {
                ReviewImage::create([
                    'review_id' => $review->id,
                    'image_url' => "images/reviews/{$slug}/user-{$userId}/review-2.jpg",
                ]);
            }
        }
    }
}