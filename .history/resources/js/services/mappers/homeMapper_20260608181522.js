import { mapCampaign } from './campaignMapper';

function normalizeImage(url) {
    if (!url) return '/images/no-image.png';

    const value = String(url).trim();

    if (!value) return '/images/no-image.png';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
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
    const minPrice = Number(product.price_min || 0);
    const maxPrice = Number(product.price_max || 0);

    if (!minPrice && !maxPrice) return 'Liên hệ';

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

        priceMin: Number(product.price_min || 0),
        priceMax: Number(product.price_max || 0),

        rating: Number(product.rating || 0),
        averageRating: Number(product.average_rating || 0),

        reviews: Number(product.review_count || 0),
        reviewCount: Number(product.review_count || 0),

        sold: Number(product.sold || 0),

        stock: Number(product.stock || 0),

        inStock: Boolean(product.in_stock),

        isFeatured: Boolean(product.is_featured),
        isActive: Boolean(product.is_active),

        raw: product,
    };
}

function getCountdownParts(totalSeconds) {
    const safeSeconds = Math.max(0, Number(totalSeconds || 0));

    const days = Math.floor(safeSeconds / 86400);
    const hours = Math.floor((safeSeconds % 86400) / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = Math.floor(safeSeconds % 60);

    return [days, hours, minutes, seconds];
}

function mapHomeCampaign(campaign = {}) {
    return mapCampaign(campaign);
}

function mapHomeCategory(category = {}) {
    return {
        id: category.id,
        name: category.name || '',
        slug: category.slug || '',

        icon: category.icon || '',
        image: normalizeImage(category.image),
        thumbnail: normalizeImage(category.thumbnail),

        childrenCount: Number(category.children_count || 0),

        raw: category,
    };
}

function mapHomeNews(item = {}) {
    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',

        description: item.excerpt || '',
        image: normalizeImage(item.thumbnail),

        date: item.published_at || '',
        category: item.category || '',

        raw: item,
    };
}

export function mapHomeResponse(response = {}) {
    return {
        featuredProducts: Array.isArray(response.featured_products)
            ? response.featured_products.map(mapHomeProduct)
            : [],

        newProducts: Array.isArray(response.new_products) ? response.new_products.map(mapHomeProduct) : [],

        bestSellingProducts: Array.isArray(response.best_selling_products)
            ? response.best_selling_products.map(mapHomeProduct)
            : [],

        topRatedProducts: Array.isArray(response.top_rated_products)
            ? response.top_rated_products.map(mapHomeProduct)
            : [],

        activeCampaigns: Array.isArray(response.active_campaigns) ? response.active_campaigns.map(mapHomeCampaign) : [],

        upcomingCampaigns: Array.isArray(response.upcoming_campaigns)
            ? response.upcoming_campaigns.map(mapHomeCampaign)
            : [],

        categories: Array.isArray(response.categories) ? response.categories.map(mapHomeCategory) : [],

        newsEvents: Array.isArray(response.news_events) ? response.news_events.map(mapHomeNews) : [],

        trendingKeywords: Array.isArray(response.trending_keywords) ? response.trending_keywords : [],

        cartCount: Number(response.cart_count || 0),

        unreadNotifications: Number(response.unread_notifications || 0),

        raw: response,
    };
}

export function mapBlogToHomeNews(blog = {}) {
    return {
        id: blog.id,
        title: blog.title || '',
        slug: blog.slug || '',
        description: blog.excerpt || '',
        image: normalizeImage(blog.thumbnail),
        date: blog.published_at || '',
        category: blog.category || '',
        raw: blog,
    };
}
