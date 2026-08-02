function toNumber(value) {
    return Number(value || 0);
}

function normalizeImage(url) {
    if (!url) return '/images/no-image.png';

    const value = String(url).trim();

    if (!value) return '/images/no-image.png';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    const normalized = value.replace(/^public\//, '').replace(/^storage\//, '');

    if (normalized.startsWith('uploads/')) {
        return `/storage/${normalized}`;
    }

    return `/${normalized}`;
}

function formatCurrency(value) {
    const number = Number(value || 0);

    if (!number) return 'Liên hệ';

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(number);
}

function getPriceText(product = {}) {
    const minPrice = Number(product.min_price || product.price_min || 0);
    const maxPrice = Number(product.max_price || product.price_max || 0);

    if (!minPrice && !maxPrice) return 'Liên hệ';

    if (minPrice && maxPrice && minPrice !== maxPrice) {
        return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    }

    return formatCurrency(minPrice || maxPrice);
}

function getOriginalPriceText(product = {}) {
    if (!product.has_promotion) return '';

    const minPrice = Number(product.original_min_price || 0);
    const maxPrice = Number(product.original_max_price || 0);

    if (!minPrice && !maxPrice) return '';

    if (minPrice && maxPrice && minPrice !== maxPrice) {
        return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    }

    return formatCurrency(minPrice || maxPrice);
}

function mapHomeProduct(product = {}) {
    return {
        id: product.id,
        name: product.name || '',
        slug: product.slug || '',

        image: normalizeImage(product.thumbnail),
        thumbnail: normalizeImage(product.thumbnail),

        category: product.category || null,
        categoryName: product.category?.name || '',

        priceText: getPriceText(product),
        originalPriceText: getOriginalPriceText(product),

        priceMin: toNumber(product.min_price || product.price_min),
        priceMax: toNumber(product.max_price || product.price_max),

        originalMinPrice: toNumber(product.original_min_price),
        originalMaxPrice: toNumber(product.original_max_price),

        promotionMinPrice: toNumber(product.promotion_min_price),
        promotionMaxPrice: toNumber(product.promotion_max_price),

        hasPromotion: Boolean(product.has_promotion),
        promotionLoginRequired: Boolean(product.promotion_login_required),

        rating: toNumber(product.rating || product.average_rating),
        averageRating: toNumber(product.average_rating || product.rating),

        reviews: toNumber(product.total_reviews || product.review_count),
        reviewCount: toNumber(product.review_count || product.total_reviews),
        totalReviews: toNumber(product.total_reviews || product.review_count),

        sold: toNumber(product.sold),

        stock: toNumber(product.stock || product.available_stock),
        availableStock: toNumber(product.available_stock || product.stock),

        inStock: Boolean(product.in_stock),

        isFeatured: Boolean(product.is_featured),
        isActive: Boolean(product.is_active),

        raw: product,
    };
}

function mapHomeCategory(category = {}) {
    const children = Array.isArray(category.children)
        ? category.children.map((child) => ({
            id: child.id,
            name: child.name || '',
            slug: child.slug || '',

            icon: child.icon || '',
            image: normalizeImage(child.image),
            thumbnail: normalizeImage(child.thumbnail),

            raw: child,
        }))
        : [];

    return {
        id: category.id,
        name: category.name || '',
        slug: category.slug || '',

        icon: category.icon || '',
        image: normalizeImage(category.image),
        thumbnail: normalizeImage(category.thumbnail),

        childrenCount: toNumber(category.children_count || children.length),
        children,

        raw: category,
    };
}

function mapHomeNews(item = {}) {
    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',

        description: item.summary || item.excerpt || item.description || '',
        image: normalizeImage(item.thumbnail || item.image),

        date: item.published_at || item.date || '',
        category: '',

        raw: item,
    };
}

function mapSiteItem(item = {}) {
    return {
        id: item.id,
        parentId: item.parent_id,

        groupKey: item.group_key || '',
        itemKey: item.item_key || '',
        itemType: item.item_type || '',

        label: item.label || '',
        title: item.title || '',
        subtitle: item.subtitle || '',
        content: item.content || '',

        iconKey: item.icon_key || '',

        image: normalizeImage(item.image),
        mobileImage: item.mobile_image ? normalizeImage(item.mobile_image) : '',

        linkText: item.link_text || item.label || '',
        linkUrl: item.link_url || '',
        target: item.target || '_self',

        payload: item.payload || {},
        sortOrder: toNumber(item.sort_order),

        raw: item,
    };
}

function mapHeroSlider(hero = {}) {
    const slides = Array.isArray(hero.slides) ? hero.slides.map(mapSiteItem) : [];
    const buttons = Array.isArray(hero.buttons) ? hero.buttons.map(mapSiteItem) : [];
    const miniCards = Array.isArray(hero.mini_cards) ? hero.mini_cards.map(mapSiteItem) : [];

    return {
        id: hero.id,

        badge: hero.badge || hero.payload?.badge || 'CTUT UniShop',
        title: hero.title || 'CTUT UniShop',
        subtitle: hero.subtitle || '',
        description: hero.description || '',

        backgroundImage: normalizeImage(hero.background_image),
        mobileBackgroundImage: hero.mobile_background_image ? normalizeImage(hero.mobile_background_image) : '',

        overlayEnabled: Boolean(hero.payload?.overlay_enabled ?? true),

        buttons,
        miniCards,
        slides,

        payload: hero.payload || {},
        raw: hero,
    };
}

export function mapHomeResponse(response = {}) {
    const data = response.data || response;
    const siteContent = data.site_content || {};

    return {
        siteContent,

        heroSlider: mapHeroSlider(siteContent.hero_slider || {}),

        featuredProducts: Array.isArray(data.featured_products) ? data.featured_products.map(mapHomeProduct) : [],

        newProducts: Array.isArray(data.new_products) ? data.new_products.map(mapHomeProduct) : [],

        bestSellingProducts: Array.isArray(data.best_selling_products)
            ? data.best_selling_products.map(mapHomeProduct)
            : [],

        topRatedProducts: Array.isArray(data.top_rated_products) ? data.top_rated_products.map(mapHomeProduct) : [],

        categories: Array.isArray(data.categories) ? data.categories.map(mapHomeCategory) : [],

        newsEvents: Array.isArray(data.news_events) ? data.news_events.map(mapHomeNews) : [],

        trendingKeywords: Array.isArray(data.trending_keywords) ? data.trending_keywords : [],

        cartCount: toNumber(data.cart_count),

        unreadNotifications: toNumber(data.unread_notifications),

        raw: data,
    };
}

export function mapBlogToHomeNews(blog = {}) {
    return {
        id: blog.id,
        title: blog.title || '',
        slug: blog.slug || '',
        description: blog.summary || blog.description || '',
        image: normalizeImage(blog.thumbnail || blog.image),
        date: blog.published_at || '',
        category: '',
        raw: blog,
    };
}
