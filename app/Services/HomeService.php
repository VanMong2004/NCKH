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

    public function index()
    {
        return [

            'success' => true,

            'message'
                => 'Lấy dữ liệu home thành công',

            'data' => [

                /*
                |--------------------------------------------------------------------------
                | FEATURED PRODUCTS
                |--------------------------------------------------------------------------
                */

                'featured_products'
                    => $this->featuredProducts(),

                /*
                |--------------------------------------------------------------------------
                | NEW PRODUCTS
                |--------------------------------------------------------------------------
                */

                'new_products'
                    => $this->newProducts(),

                /*
                |--------------------------------------------------------------------------
                | BEST SELLING
                |--------------------------------------------------------------------------
                */

                'best_selling_products'
                    => $this->bestSellingProducts(),

                /*
                |--------------------------------------------------------------------------
                | TOP RATED
                |--------------------------------------------------------------------------
                */

                'top_rated_products'
                    => $this->topRatedProducts(),

                /*
                |--------------------------------------------------------------------------
                | CAMPAIGNS
                |--------------------------------------------------------------------------
                */

                'active_campaigns'
                    => $this->activeCampaigns(),

                'upcoming_campaigns'
                    => $this->upcomingCampaigns(),

                /*
                |--------------------------------------------------------------------------
                | CATEGORIES
                |--------------------------------------------------------------------------
                */

                'categories'
                    => $this->categories(),
            ]
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

                    'name'
                        => $campaign->name,

                    'description'
                        => $campaign->description,

                    'banner'
                        => $campaign->banner,

                    'thumbnail'
                        => $campaign->thumbnail,

                    'start_date'
                        => $campaign->start_date,

                    'end_date'
                        => $campaign->end_date,
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

                    'name'
                        => $campaign->name,

                    'description'
                        => $campaign->description,

                    'banner'
                        => $campaign->banner,

                    'thumbnail'
                        => $campaign->thumbnail,

                    'start_date'
                        => $campaign->start_date,

                    'end_date'
                        => $campaign->end_date,
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

                    'id'
                        => $category->id,

                    'name'
                        => $category->name,

                    'children_count'
                        => $category->children_count,
                ];
            });
    }
}