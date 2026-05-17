<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Category;
use App\Models\Campaign;

class HomeService
{
    const HOME_PRODUCT_LIMIT = 8;

    /*
    |--------------------------------------------------------------------------
    | HOME
    |--------------------------------------------------------------------------
    */

    public function getHomeData()
    {
        return [
            'featured_products' => $this->featuredProducts(),
            'new_products' => $this->newProducts(),
            'best_selling_products' => $this->bestSellingProducts(),
            'top_rated_products' => $this->topRatedProducts(),

            'active_campaigns' => $this->activeCampaigns(),
            'upcoming_campaigns' => $this->upcomingCampaigns(),

            'categories' => $this->categories(),

            'cart_count' => auth()->check()
                ? app(CartService::class)->getCount(auth()->user())['data']
                : 0,

            'unread_notifications' => 0,

            'news_events' => [],

            'trending_keywords' => [
                'đồng phục',
                'phụ kiện',
                'bảng tên',
                'sự kiện',
                'campaign',
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | FEATURED PRODUCTS
    |--------------------------------------------------------------------------
    */

    protected function featuredProducts()
    {
        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category'
            ])
            ->where('is_active', true)
            ->where('is_featured', true)
            ->latest()
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $products->map(
            fn($product)
                => app(ProductService::class)
                    ->formatProduct($product)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | NEW PRODUCTS
    |--------------------------------------------------------------------------
    */

    protected function newProducts()
    {
        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category'
            ])
            ->where('is_active', true)
            ->latest()
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $products->map(
            fn($product)
                => app(ProductService::class)
                    ->formatProduct($product)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BEST SELLING
    |--------------------------------------------------------------------------
    */

    protected function bestSellingProducts()
    {
        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category'
            ])
            ->where('is_active', true)
            ->withSum('variants', 'sold_stock')
            ->orderByDesc(
                'variants_sum_sold_stock'
            )
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $products->map(
            fn($product)
                => app(ProductService::class)
                    ->formatProduct($product)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TOP RATED
    |--------------------------------------------------------------------------
    */

    protected function topRatedProducts()
    {
        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category'
            ])
            ->where('is_active', true)
            ->orderByDesc('average_rating')
            ->orderByDesc('total_reviews')
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $products->map(
            fn($product)
                => app(ProductService::class)
                    ->formatProduct($product)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE CAMPAIGNS
    |--------------------------------------------------------------------------
    */

    protected function activeCampaigns()
    {
        return Campaign::query()
            ->where('is_active',true)
            ->where(
                'start_date',
                '<=',
                now()
            )
            ->where(
                'end_date',
                '>=',
                now()
            )
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($campaign) {

                return [

                    'id'
                        => $campaign->id,

                    'title'
                        => $campaign->title,

                    'description'
                        => $campaign->description,

                    'banner'
                        => $campaign->banner,

                    'thumbnail'
                        => $campaign->thumbnail,

                    'limit'
                        => $campaign->limit,

                    'start_date'
                        => $campaign->start_date,

                    'end_date'
                        => $campaign->end_date,

                    'status' 
                        => $campaign->status,

                    'countdown_seconds'
                        => now()->diffInSeconds(
                            $campaign->end_date,
                            false
                        )
                ];
            });
    }

    /*
    |--------------------------------------------------------------------------
    | UPCOMING CAMPAIGNS
    |--------------------------------------------------------------------------
    */

    protected function upcomingCampaigns()
    {
        return Campaign::query()
            ->where('is_active', true)
            ->where(
                'start_date',
                '>',
                now()
            )
            ->orderBy('start_date')
            ->limit(5)
            ->get()
            ->map(function ($campaign) {

                return [

                    'id'
                        => $campaign->id,

                    'title'
                        => $campaign->title,

                    'description'
                        => $campaign->description,

                    'banner'
                        => $campaign->banner,

                    'thumbnail'
                        => $campaign->thumbnail,

                    'limit' 
                        => $campaign->limit,

                    'start_date'
                        => $campaign->start_date,

                    'end_date'
                        => $campaign->end_date,

                    'status'
                        => $campaign->status,

                    'countdown_seconds'
                        => now()->diffInSeconds($campaign->start_date, false),
                ];
            });
    }

    /*
    |--------------------------------------------------------------------------
    | ROOT CATEGORIES
    |--------------------------------------------------------------------------
    */

    protected function categories()
    {
        return Category::query()
            ->whereNull('parent_id')
            ->withCount('children')
            ->latest()
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'icon' => $category->icon,
                    'image' => $category->image,
                    'thumbnail' => $category->thumbnail,
                    'children_count' => $category->children_count,
                ];
            });
    }
}