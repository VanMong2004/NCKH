<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\SiteComponent;
use Throwable;

class HomeService
{
    const HOME_PRODUCT_LIMIT = 8;

    /*
    | HOME
    */

    public function getHomeData($user = null)
    {
        return [
            /*
                    | DỮ LIỆU ĐỘNG GIAO DIỆN
                    */

            'site_content' => $this->siteContent('home'),

            /*
                    | DỮ LIỆU CŨ CHO FE
                    */

            'featured_products' => $this->featuredProducts($user),
            'new_products' => $this->newProducts($user),
            'best_selling_products' => $this->bestSellingProducts($user),
            'top_rated_products' => $this->topRatedProducts($user),

            'categories' => $this->categories(),

            'cart_count' => $this->cartCount($user),

            'unread_notifications' => 0,

            'news_events' => [],

            'trending_keywords' => [
                'đồng phục',
                'phụ kiện',
                'bảng tên',
                'sản phẩm mới',
                'CTUT Shop',
            ],
        ];
    }

    protected function cartCount($user = null): int
    {
        if (!$user) {
            return 0;
        }

        try {
            $result = app(CartService::class)->getCount($user, null);

            $data = $result['data'] ?? 0;

            if (is_array($data)) {
                return (int) (
                    $data['count']
                    ?? $data['total']
                    ?? $data['total_items']
                    ?? 0
                );
            }

            return (int) $data;
        } catch (Throwable $e) {
            return 0;
        }
    }

    /*
    | SITE CONTENT
    */

    protected function siteContent(string $pageKey = 'home'): array
    {
        $components = SiteComponent::query()
            ->with([
                'activeRootItems.activeChildren',
            ])
            ->where('page_key', $pageKey)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->keyBy('component_key');

        $navbar = $components->get('navbar');
        $mobileMenu = $components->get('mobile_menu');
        $bottomNavigation = $components->get('bottom_navigation');
        $footer = $components->get('footer');
        $heroSlider = $components->get('hero_slider');

        return [
            'site' => $this->formatSiteInfo($navbar, $footer),

            'navbar' => $this->formatNavbar($navbar),

            'mobile_menu' => $this->formatMobileMenu($mobileMenu),

            'bottom_navigation' => $this->formatBottomNavigation($bottomNavigation),

            'footer' => $this->formatFooter($footer),

            'hero_slider' => $this->formatHeroSlider($heroSlider),
        ];
    }

    protected function formatSiteInfo($navbar = null, $footer = null): array
    {
        return [
            'name' => $navbar?->title
                ?? $footer?->title
                ?? 'CTUT Shop',

            'tagline' => $navbar?->subtitle
                ?? $footer?->subtitle
                ?? 'Cùng nhau phát triển',

            'logo' => $navbar?->image
                ?? $footer?->image
                ?? '/images/logo.png',
        ];
    }

    protected function formatNavbar($component = null): array
    {
        if (!$component) {
            return [
                'title' => 'CTUT Shop',
                'subtitle' => 'Cùng nhau phát triển',
                'logo' => '/images/logo.png',
                'payload' => [],
                'desktop_links' => [],
                'user_menu_links' => [],
            ];
        }

        return [
            'id' => $component->id,
            'title' => $component->title,
            'subtitle' => $component->subtitle,
            'logo' => $component->image,
            'mobile_logo' => $component->mobile_image,
            'payload' => $component->payload ?? [],

            'desktop_links' => $this->itemsByGroup($component, 'desktop_links')
                ->map(fn ($item) => $this->formatSimpleItem($item))
                ->values()
                ->toArray(),

            'user_menu_links' => $this->itemsByGroup($component, 'user_menu_links')
                ->map(fn ($item) => $this->formatSimpleItem($item))
                ->values()
                ->toArray(),
        ];
    }

    protected function formatMobileMenu($component = null): array
    {
        if (!$component) {
            return [
                'title' => 'CTUT Shop',
                'subtitle' => 'Cùng nhau phát triển',
                'logo' => '/images/logo.png',
                'payload' => [],
                'links' => [],
            ];
        }

        return [
            'id' => $component->id,
            'title' => $component->title,
            'subtitle' => $component->subtitle,
            'logo' => $component->image,
            'mobile_logo' => $component->mobile_image,
            'payload' => $component->payload ?? [],

            'links' => $this->itemsByGroup($component, 'mobile_links')
                ->map(fn ($item) => $this->formatSimpleItem($item))
                ->values()
                ->toArray(),
        ];
    }

    protected function formatBottomNavigation($component = null): array
    {
        if (!$component) {
            return [
                'items' => [],
            ];
        }

        return [
            'id' => $component->id,
            'payload' => $component->payload ?? [],

            'items' => $this->itemsByGroup($component, 'bottom_items')
                ->map(fn ($item) => $this->formatSimpleItem($item))
                ->values()
                ->toArray(),
        ];
    }

    protected function formatFooter($component = null): array
    {
        if (!$component) {
            return [
                'brand' => [
                    'title' => 'CTUT Shop',
                    'subtitle' => 'Cùng nhau phát triển',
                    'content' => null,
                    'logo' => '/images/logo.png',
                ],
                'columns' => [],
                'contacts' => [],
                'socials' => [],
                'payload' => [],
            ];
        }

        return [
            'id' => $component->id,

            'brand' => [
                'title' => $component->title,
                'subtitle' => $component->subtitle,
                'content' => $component->content,
                'logo' => $component->image,
                'mobile_logo' => $component->mobile_image,
            ],

            'payload' => $component->payload ?? [],

            'columns' => $this->itemsByGroup($component, 'footer_columns')
                ->map(function ($column) {
                    return [
                        'id' => $column->id,
                        'item_key' => $column->item_key,
                        'title' => $column->title,
                        'label' => $column->label,
                        'sort_order' => (int) $column->sort_order,

                        'links' => $this->activeChildren($column)
                            ->map(fn ($child) => $this->formatSimpleItem($child))
                            ->values()
                            ->toArray(),
                    ];
                })
                ->values()
                ->toArray(),

            'contacts' => $this->itemsByGroup($component, 'footer_contacts')
                ->map(fn ($item) => $this->formatSimpleItem($item))
                ->values()
                ->toArray(),

            'socials' => $this->itemsByGroup($component, 'footer_socials')
                ->map(fn ($item) => $this->formatSimpleItem($item))
                ->values()
                ->toArray(),
        ];
    }

    protected function formatHeroSlider($component = null): array
    {
        if (!$component) {
            return [
                'badge' => 'CTUT Shop',
                'title' => 'Kết nối sản phẩm, hoạt động và trải nghiệm sinh viên',
                'description' => null,
                'background_image' => '/images/system/Rectangle_3897.jpg',
                'mobile_background_image' => null,
                'buttons' => [],
                'mini_cards' => [],
                'slides' => [],
                'payload' => [],
            ];
        }

        return [
            'id' => $component->id,
            'badge' => data_get($component->payload, 'badge', $component->subtitle),
            'title' => $component->title,
            'subtitle' => $component->subtitle,
            'description' => $component->content,
            'background_image' => $component->image,
            'mobile_background_image' => $component->mobile_image,
            'payload' => $component->payload ?? [],

            'buttons' => $this->itemsByGroup($component, 'hero_buttons')
                ->map(fn ($item) => $this->formatSimpleItem($item))
                ->values()
                ->toArray(),

            'mini_cards' => $this->itemsByGroup($component, 'hero_cards')
                ->map(fn ($item) => $this->formatSimpleItem($item))
                ->values()
                ->toArray(),

            'slides' => $this->itemsByGroup($component, 'hero_slides')
                ->map(fn ($item) => $this->formatSimpleItem($item))
                ->values()
                ->toArray(),
        ];
    }

    protected function itemsByGroup($component, string $groupKey)
    {
        if (!$component || !$component->relationLoaded('activeRootItems')) {
            return collect();
        }

        return $component->activeRootItems
            ->where('group_key', $groupKey)
            ->sortBy([
                ['sort_order', 'asc'],
                ['id', 'asc'],
            ])
            ->values();
    }

    protected function activeChildren($item)
    {
        if (!$item || !$item->relationLoaded('activeChildren')) {
            return collect();
        }

        return $item->activeChildren
            ->sortBy([
                ['sort_order', 'asc'],
                ['id', 'asc'],
            ])
            ->values();
    }

    protected function formatSimpleItem($item): array
    {
        return [
            'id' => $item->id,
            'parent_id' => $item->parent_id,
            'group_key' => $item->group_key,
            'item_key' => $item->item_key,
            'item_type' => $item->item_type,

            'label' => $item->label,
            'title' => $item->title,
            'subtitle' => $item->subtitle,
            'content' => $item->content,

            'icon_key' => $item->icon_key,

            'image' => $item->image,
            'mobile_image' => $item->mobile_image,

            'link_text' => $item->link_text,
            'link_url' => $item->link_url,
            'target' => $item->target,

            'payload' => $item->payload ?? [],

            'sort_order' => (int) $item->sort_order,
        ];
    }

    /*
    | FEATURED PRODUCTS
    */

    protected function featuredProducts($user = null)
    {
        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category',
            ])
            ->where('is_active', true)
            ->where('is_featured', true)
            ->latest()
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $products->map(
            fn ($product) => app(ProductService::class)
                ->formatProduct($product, $user)
        );
    }

    /*
    | NEW PRODUCTS
    */

    protected function newProducts($user = null)
    {
        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category',
            ])
            ->where('is_active', true)
            ->latest()
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $products->map(
            fn ($product) => app(ProductService::class)
                ->formatProduct($product, $user)
        );
    }

    /*
    | BEST SELLING
    */

    protected function bestSellingProducts($user = null)
    {
        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category',
            ])
            ->where('is_active', true)
            ->withSum('variants', 'sold_stock')
            ->orderByDesc('variants_sum_sold_stock')
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $products->map(
            fn ($product) => app(ProductService::class)
                ->formatProduct($product, $user)
        );
    }

    /*
    | TOP RATED
    */

    protected function topRatedProducts($user = null)
    {
        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category',
            ])
            ->where('is_active', true)
            ->orderByDesc('average_rating')
            ->orderByDesc('total_reviews')
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $products->map(
            fn ($product) => app(ProductService::class)
                ->formatProduct($product, $user)
        );
    }

    /*
    | ROOT CATEGORIES
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
                    'children_count' => (int) $category->children_count,
                ];
            });
    }

    
}