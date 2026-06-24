<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductStatisticSeeder extends Seeder
{
    public function run(): void
    {
        Product::with(['reviews', 'variants'])
            ->get()
            ->each(function (Product $product) {
                $totalReviews = $product->reviews->count();

                $averageRating = $totalReviews > 0
                    ? round($product->reviews->avg('rating'), 2)
                    : 0;

                $soldCount = $product->variants->sum('sold_stock');

                $product->update([
                    'average_rating' => $averageRating,
                    'total_reviews' => $totalReviews,
                    'sold_count' => $soldCount,
                ]);
            });
    }
}