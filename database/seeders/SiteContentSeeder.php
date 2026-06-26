<?php

namespace Database\Seeders;

use App\Models\SiteComponent;
use App\Models\SiteComponentItem;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedNavbar();
        $this->seedMobileMenu();
        $this->seedBottomNavigation();
        $this->seedFooter();
        $this->seedHeroSlider();
        $this->seedAuthBanner();
    }

    private function seedNavbar(): void
    {
        $component = $this->component([
            'page_key' => 'home',
            'page_name' => 'Trang chủ',
            'component_key' => 'navbar',
            'component_name' => 'Thanh điều hướng PC',
            'component_type' => 'navigation',
            'title' => 'CTUT STORE',
            'subtitle' => 'Official Store of Can Tho University of Technology',
            'image' => '/storage/uploads/site-content/logo-20260624131441-foZ2w58N.png',
            'payload' => [
                'category_button_label' => '☰ Tất cả danh mục',
                'search_placeholder' => 'Tìm sản phẩm...',
                'mobile_search_placeholder' => 'Tìm sản phẩm...',
                'login_label' => 'Đăng nhập',
                'logout_label' => 'Đăng xuất',
                'greeting_prefix' => 'Xin chào,',
                'light_label' => 'Sáng',
                'dark_label' => 'Tối',
                'cart_label' => 'Giỏ hàng',
            ],
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $links = [
            ['home', 'Trang chủ', '/', 1],
            ['shop', 'Sản phẩm', '/shop', 2],
            ['promotions', 'Khuyến mãi', '/promotions', 3],
            ['blog', 'Blog', '/blog', 4],
            ['faq', 'FAQ', '/faq', 5],
            ['about', 'Giới thiệu', '/about', 6],
            ['contact', 'Liên hệ', '/contact', 7],
            ['policy', 'Chính sách', '/policy', 8],
        ];

        foreach ($links as [$key, $label, $url, $order]) {
            $this->item($component, [
                'group_key' => 'desktop_links',
                'item_key' => 'desktop_' . $key,
                'item_type' => 'nav_link',
                'label' => $label,
                'link_url' => $url,
                'sort_order' => $order,
                'is_active' => true,
            ]);
        }

        $userLinks = [
            ['profile', 'Tài khoản của tôi', '/account/profile', 1],
            ['orders', 'Đơn hàng của tôi', '/account/orders', 2],
        ];

        foreach ($userLinks as [$key, $label, $url, $order]) {
            $this->item($component, [
                'group_key' => 'user_menu_links',
                'item_key' => 'user_menu_' . $key,
                'item_type' => 'user_menu_link',
                'label' => $label,
                'link_url' => $url,
                'sort_order' => $order,
                'is_active' => true,
            ]);
        }
    }

    private function seedMobileMenu(): void
    {
        $component = $this->component([
            'page_key' => 'home',
            'page_name' => 'Trang chủ',
            'component_key' => 'mobile_menu',
            'component_name' => 'Menu mobile',
            'component_type' => 'navigation',
            'title' => 'CTUT STORE',
            'subtitle' => 'Official Store of Can Tho University of Technology',
            'image' => '/storage/uploads/site-content/logo-20260624131441-foZ2w58N.png',
            'payload' => [
                'login_label' => 'Đăng nhập',
                'logout_label' => 'Đăng xuất',
            ],
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $links = [
            ['home', 'Trang chủ', '/', 1],
            ['shop', 'Sản phẩm', '/shop', 2],
            ['promotions', 'Khuyến mãi', '/promotions', 3],
            ['orders', 'Đơn hàng', '/account/orders', 4],
            ['blog', 'Blog', '/blog', 5],
            ['faq', 'FAQ', '/faq', 6],
            ['about', 'Giới thiệu', '/about', 7],
            ['contact', 'Liên hệ', '/contact', 8],
            ['policy', 'Chính sách', '/policy', 9],
        ];

        foreach ($links as [$key, $label, $url, $order]) {
            $this->item($component, [
                'group_key' => 'mobile_links',
                'item_key' => 'mobile_' . $key,
                'item_type' => 'mobile_nav_link',
                'label' => $label,
                'link_url' => $url,
                'sort_order' => $order,
                'is_active' => true,
            ]);
        }
    }

    private function seedBottomNavigation(): void
    {
        $component = $this->component([
            'page_key' => 'home',
            'page_name' => 'Trang chủ',
            'component_key' => 'bottom_navigation',
            'component_name' => 'Thanh điều hướng mobile dưới',
            'component_type' => 'bottom_navigation',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        $items = [
            ['home', 'Trang chủ', '/', 'home', 1],
            ['shop', 'Cửa hàng', '/shop', 'shop', 2],
            ['cart', 'Giỏ hàng', '/cart', 'cart', 3],
            ['account', 'Tài khoản', '/account/profile', 'user', 4],
        ];

        foreach ($items as [$key, $label, $url, $icon, $order]) {
            $this->item($component, [
                'group_key' => 'bottom_items',
                'item_key' => 'bottom_' . $key,
                'item_type' => 'bottom_nav_item',
                'label' => $label,
                'link_url' => $url,
                'icon_key' => $icon,
                'sort_order' => $order,
                'is_active' => true,
            ]);
        }
    }

    private function seedFooter(): void
    {
        $component = $this->component([
            'page_key' => 'home',
            'page_name' => 'Trang chủ',
            'component_key' => 'footer',
            'component_name' => 'Chân trang',
            'component_type' => 'footer',
            'title' => 'CTUT STORE',
            'subtitle' => 'Official Store of Can Tho University of Technology',
            'content' => 'Nơi cung cấp các sản phẩm chính hãng, đồng hành cùng sinh viên và giảng viên CTUT.',
            'image' => '/storage/uploads/site-content/logo-20260624131441-foZ2w58N.png',
            'payload' => [
                'copyright' => '© 2026 CTUT STORE. All rights reserved.',
            ],
            'sort_order' => 4,
            'is_active' => true,
        ]);

        $quickColumn = $this->item($component, [
            'group_key' => 'footer_columns',
            'item_key' => 'footer_column_links',
            'item_type' => 'footer_column',
            'title' => 'Khám phá',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $quickLinks = [
            ['home', 'Trang chủ', '/', 1],
            ['shop', 'Sản phẩm', '/shop', 2],
            ['promotions', 'Khuyến mãi', '/promotions', 3],
            ['blog', 'Blog', '/blog', 4],
        ];

        foreach ($quickLinks as [$key, $label, $url, $order]) {
            $this->item($component, [
                'parent_id' => $quickColumn->id,
                'group_key' => 'footer_column_links',
                'item_key' => 'footer_link_' . $key,
                'item_type' => 'footer_link',
                'label' => $label,
                'link_url' => $url,
                'sort_order' => $order,
                'is_active' => true,
            ]);
        }

        $supportColumn = $this->item($component, [
            'group_key' => 'footer_columns',
            'item_key' => 'footer_column_support',
            'item_type' => 'footer_column',
            'title' => 'Hỗ trợ',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $supportLinks = [
            ['profile', 'Tài khoản', '/account/profile', 1],
            ['orders', 'Đơn hàng', '/account/orders', 2],
            ['cart', 'Giỏ hàng', '/cart', 3],
            ['contact', 'Liên hệ', '/contact', 4],
        ];

        foreach ($supportLinks as [$key, $label, $url, $order]) {
            $this->item($component, [
                'parent_id' => $supportColumn->id,
                'group_key' => 'footer_column_support',
                'item_key' => 'footer_support_' . $key,
                'item_type' => 'footer_link',
                'label' => $label,
                'link_url' => $url,
                'sort_order' => $order,
                'is_active' => true,
            ]);
        }

        $contacts = [
            ['address', '256 Nguyễn Văn Cừ, Phường Cái Khế, Thành phố Cần Thơ', 'map-pin', 1],
            ['phone', '02923 894 050', 'phone', 2],
            ['email', 'phonghanhchinh@ctuet.edu.vn', 'mail', 3],
        ];

        foreach ($contacts as [$key, $label, $icon, $order]) {
            $this->item($component, [
                'group_key' => 'footer_contacts',
                'item_key' => 'footer_contact_' . $key,
                'item_type' => 'contact',
                'label' => $label,
                'icon_key' => $icon,
                'sort_order' => $order,
                'is_active' => true,
            ]);
        }

        $this->item($component, [
            'group_key' => 'footer_socials',
            'item_key' => 'footer_social_facebook',
            'item_type' => 'social',
            'label' => 'Facebook',
            'icon_key' => 'facebook',
            'link_url' => 'https://www.facebook.com/CTUT.CT',
            'target' => '_blank',
            'sort_order' => 1,
            'is_active' => true,
        ]);
    }

    private function seedHeroSlider(): void
    {
        $component = $this->component([
            'page_key' => 'home',
            'page_name' => 'Trang chủ',
            'component_key' => 'hero_slider',
            'component_name' => 'Hero / Slider trang chủ',
            'component_type' => 'slider',
            'title' => 'Kết nối sản phẩm, hoạt động và trải nghiệm sinh viên',
            'subtitle' => 'CTUT Shop',
            'content' => 'Khám phá sản phẩm nổi bật, cập nhật tin tức và theo dõi đơn hàng thuận tiện trên hệ thống.',
            'image' => '/storage/uploads/site-content/bg-sign-20260624163322-Fp3qwL1P.png',
            'payload' => [
                'badge' => 'CTUT Shop',
                'overlay_enabled' => true,
            ],
            'sort_order' => 5,
            'is_active' => true,
        ]);

        $buttons = [
            ['shop', 'Khám phá cửa hàng', '/shop', 1],
            ['about', 'Tìm hiểu thêm', '/about', 2],
        ];

        foreach ($buttons as [$key, $label, $url, $order]) {
            $this->item($component, [
                'group_key' => 'hero_buttons',
                'item_key' => 'hero_button_' . $key,
                'item_type' => 'button',
                'label' => $label,
                'link_url' => $url,
                'icon_key' => 'arrow-right',
                'sort_order' => $order,
                'is_active' => true,
            ]);
        }

        $cards = [
            [
                'order',
                'Đặt hàng thuận tiện',
                'Xem sản phẩm, chọn biến thể và theo dõi trạng thái đơn hàng.',
                'package-check',
                1,
            ],
            [
                'news',
                'Cập nhật nhanh chóng',
                'Theo dõi thông tin mới, sản phẩm nổi bật và thông báo từ hệ thống.',
                'sparkles',
                2,
            ],
            [
                'secure',
                'Thông tin minh bạch',
                'Theo dõi thanh toán, nhận hàng, thông báo và chính sách rõ ràng.',
                'shield-check',
                3,
            ],
        ];

        foreach ($cards as [$key, $title, $content, $icon, $order]) {
            $this->item($component, [
                'group_key' => 'hero_cards',
                'item_key' => 'hero_card_' . $key,
                'item_type' => 'mini_card',
                'title' => $title,
                'content' => $content,
                'icon_key' => $icon,
                'sort_order' => $order,
                'is_active' => true,
            ]);
        }

        $this->item($component, [
            'group_key' => 'hero_slides',
            'item_key' => 'hero_slide_main',
            'item_type' => 'slide',
            'title' => 'Kết nối sản phẩm, hoạt động và trải nghiệm sinh viên',
            'subtitle' => 'CTUT Shop',
            'content' => 'Khám phá sản phẩm nổi bật, cập nhật tin tức và theo dõi đơn hàng thuận tiện trên hệ thống.',
            'image' => '/storage/uploads/site-content/bg-sign-20260624163322-Fp3qwL1P.png',
            'link_text' => 'Khám phá cửa hàng',
            'link_url' => '/shop',
            'sort_order' => 1,
            'is_active' => true,
        ]);
    }

    private function seedAuthBanner(): void
    {
        $this->component([
            'page_key' => 'home',
            'page_name' => 'Trang chủ',
            'component_key' => 'auth_banner',
            'component_name' => 'Banner đăng nhập / đăng ký',
            'component_type' => 'banner',
            'title' => 'Chào mừng quay lại',
            'subtitle' => 'CTUT STORE',
            'content' => 'Đăng nhập để nhận thêm nhiều ưu đãi và theo dõi đơn hàng của bạn.',
            'image' => '/images/bg-sign.png',
            'payload' => [
                'feature_1_title' => 'Khuyến mãi hấp dẫn',
                'feature_1_desc' => 'Nhận các chương trình khuyến mãi và ưu đãi dành riêng cho cộng đồng CTUT.',
                'feature_2_title' => 'Sản phẩm chất lượng',
                'feature_2_desc' => 'Đồng phục, phụ kiện và quà lưu niệm chính hãng.',
                'feature_3_title' => 'Tin tức mới nhất',
                'feature_3_desc' => 'Cập nhật hoạt động, thông báo và sự kiện mới nhất từ nhà trường.',
            ],
            'sort_order' => 6,
            'is_active' => true,
        ]);
    }

    private function component(array $data): SiteComponent
    {
        return SiteComponent::updateOrCreate(
            [
                'page_key' => $data['page_key'],
                'component_key' => $data['component_key'],
            ],
            $data
        );
    }

    private function item(SiteComponent $component, array $data): SiteComponentItem
    {
        $data['component_id'] = $component->id;

        return SiteComponentItem::updateOrCreate(
            [
                'component_id' => $component->id,
                'item_key' => $data['item_key'],
            ],
            $data
        );
    }
}