<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\SiteComponent;
use Illuminate\Support\Facades\Cache;
use Throwable;

class HomeService
{
    const HOME_PRODUCT_LIMIT = 8;
    private const HOME_CACHE_MINUTES = 5;

    /*
    | HOME
    */
    public function getHomeData($user = null)
    {
        return [
            'site_content' => $this->siteContent('home'),

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
                'áo thun',
                'áo polo',
                'phụ kiện',
                'bảng tên',
                'móc khóa',
                'dây đeo',
            ],
        ];
    }

    public function getSiteContent(string $pageKey = 'home'): array
    {
        return $this->siteContent($pageKey);
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
        return Cache::remember(
            "home:site_content:{$pageKey}",
            now()->addMinutes(self::HOME_CACHE_MINUTES),
            function () use ($pageKey) {
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
                $authBanner = $components->get('auth_banner');

                return [
                    'site' => $this->formatSiteInfo($navbar, $footer),

                    'navbar' => $this->formatNavbar($navbar),

                    'mobile_menu' => $this->formatMobileMenu($mobileMenu),

                    'bottom_navigation' => $this->formatBottomNavigation($bottomNavigation),

                    'footer' => $this->formatFooter($footer),

                    'hero_slider' => $this->formatHeroSlider($heroSlider),

                    'auth_banner' => $this->formatAuthBanner($authBanner),
                ];
            }
        );
    }

    protected function formatSiteInfo($navbar = null, $footer = null): array
    {
        return [
            'name' => $navbar?->title
                ?? $footer?->title
                ?? 'CTUT UniShop',

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
                'title' => 'CTUT UniShop',
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
                'title' => 'CTUT UniShop',
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
                    'title' => 'CTUT UniShop',
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
                'badge' => 'CTUT UniShop',
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

    protected function formatAuthBanner($component = null): array
    {
        if (!$component) {
            return [
                'title' => 'Chào mừng quay lại',
                'subtitle' => 'CTUT UniShop',
                'description' => 'Đăng nhập để mua hàng, quản lý giỏ hàng và theo dõi đơn hàng.',
                'image' => '/images/bg-sign.png',
                'mobile_image' => null,
                'payload' => [],
            ];
        }

        return [
            'id' => $component->id,
            'title' => $component->title,
            'subtitle' => $component->subtitle,
            'description' => $component->content,
            'image' => $component->image,
            'mobile_image' => $component->mobile_image,
            'payload' => $component->payload ?? [],
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
            'is_active' => (bool) $item->is_active,
        ];
    }

    protected function featuredProducts($user = null)
    {
        if (!$user) {
            return Cache::remember(
                'home:featured_products:guest:v1',
                now()->addMinutes(self::HOME_CACHE_MINUTES),
                function () {
                    $products = Product::query()
                        ->with($this->productRelations())
                        ->where('is_active', true)
                        ->where('is_featured', true)
                        ->latest()
                        ->limit(self::HOME_PRODUCT_LIMIT)
                        ->get();

                    return $this->formatProducts($products, null);
                }
            );
        }

        $products = Product::query()
            ->with($this->productRelations())
            ->where('is_active', true)
            ->where('is_featured', true)
            ->latest()
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $this->formatProducts($products, $user);
    }

    protected function newProducts($user = null)
    {
        if (!$user) {
            return Cache::remember(
                'home:new_products:guest:v1',
                now()->addMinutes(self::HOME_CACHE_MINUTES),
                function () {
                    $products = Product::query()
                        ->with($this->productRelations())
                        ->where('is_active', true)
                        ->latest()
                        ->limit(self::HOME_PRODUCT_LIMIT)
                        ->get();

                    return $this->formatProducts($products, null);
                }
            );
        }

        $products = Product::query()
            ->with($this->productRelations())
            ->where('is_active', true)
            ->latest()
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $this->formatProducts($products, $user);
    }

    protected function bestSellingProducts($user = null)
    {
        if (!$user) {
            return Cache::remember(
                'home:best_selling_products:guest:v1',
                now()->addMinutes(self::HOME_CACHE_MINUTES),
                function () {
                    $products = Product::query()
                        ->with($this->productRelations())
                        ->where('is_active', true)
                        ->withSum('variants', 'sold_stock')
                        ->orderByDesc('variants_sum_sold_stock')
                        ->limit(self::HOME_PRODUCT_LIMIT)
                        ->get();

                    return $this->formatProducts($products, null);
                }
            );
        }

        $products = Product::query()
            ->with($this->productRelations())
            ->where('is_active', true)
            ->withSum('variants', 'sold_stock')
            ->orderByDesc('variants_sum_sold_stock')
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $this->formatProducts($products, $user);
    }

    protected function topRatedProducts($user = null)
    {
        if (!$user) {
            return Cache::remember(
                'home:top_rated_products:guest:v1',
                now()->addMinutes(self::HOME_CACHE_MINUTES),
                function () {
                    $products = Product::query()
                        ->with($this->productRelations())
                        ->where('is_active', true)
                        ->orderByDesc('average_rating')
                        ->orderByDesc('total_reviews')
                        ->limit(self::HOME_PRODUCT_LIMIT)
                        ->get();

                    return $this->formatProducts($products, null);
                }
            );
        }

        $products = Product::query()
            ->with($this->productRelations())
            ->where('is_active', true)
            ->orderByDesc('average_rating')
            ->orderByDesc('total_reviews')
            ->limit(self::HOME_PRODUCT_LIMIT)
            ->get();

        return $this->formatProducts($products, $user);
    }

    protected function categories()
    {
        return Cache::remember(
            'home:categories:v1',
            now()->addMinutes(self::HOME_CACHE_MINUTES),
            fn () => Category::query()
                ->select(['id', 'name', 'slug', 'icon', 'image', 'thumbnail', 'parent_id', 'created_at'])
                ->whereNull('parent_id')
                ->with([
                    'children' => function ($q) {
                        $q->select(['id', 'name', 'slug', 'icon', 'image', 'thumbnail', 'parent_id', 'created_at'])
                            ->latest();
                    },
                ])
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

                        'children' => $category->children
                            ->map(function ($child) {
                                return [
                                    'id' => $child->id,
                                    'name' => $child->name,
                                    'slug' => $child->slug,
                                    'icon' => $child->icon,
                                    'image' => $child->image,
                                    'thumbnail' => $child->thumbnail,
                                ];
                            })
                            ->values(),
                    ];
                })
        );
    }

    protected function formatProducts($products, $user = null)
    {
        $productService = app(ProductService::class);

        return $products->map(
            fn ($product) => $productService->formatProductSummary($product, $user)
        );
    }

    protected function productRelations(): array
    {
        return [
            'thumbnailImage:id,product_id,url,type,position',
            'primaryImage:id,product_id,url,type,position',
            'variants' => function ($query) {
                $query->select([
                    'id',
                    'product_id',
                    'size',
                    'color',
                    'price',
                    'stock',
                    'reserved_stock',
                    'sold_stock',
                    'is_active',
                ])->where('is_active', true);
            },
            'category:id,parent_id,name,slug',
            'department:id,name,slug,code',
        ];
    }
}
