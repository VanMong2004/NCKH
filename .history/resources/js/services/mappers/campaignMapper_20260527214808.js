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

function getPriceText(item = {}) {
    const minPrice = Number(item.price_min || 0);
    const maxPrice = Number(item.price_max || 0);

    if (!minPrice && !maxPrice) return 'Liên hệ';

    if (minPrice && maxPrice && minPrice !== maxPrice) {
        return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    }

    return formatCurrency(minPrice || maxPrice);
}

function mapProduct(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',

        image: normalizeImage(item.thumbnail),
        thumbnail: normalizeImage(item.thumbnail),

        categoryName: item.category?.name || '',

        priceText: getPriceText(item),

        rating: Number(item.average_rating || 0),
        reviews: Number(item.review_count || 0),

        sold: Number(item.sold || 0),
        stock: Number(item.stock || 0),

        inStock: Boolean(item.in_stock),

        label: item.is_featured ? 'Nổi bật' : '',

        raw: item,
    };
}

function mapCampaign(item = {}) {
    const seconds = Math.max(0, Number(item.countdown_seconds || 0));

    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        description: item.description || '',

        image: normalizeImage(item.thumbnail),
        thumbnail: normalizeImage(item.thumbnail),
        banner: normalizeImage(item.banner),

        status: item.status || '',

        startDate: item.start_date || '',
        endDate: item.end_date || '',

        countdownSeconds: seconds,
        time: getCountdownParts(seconds),

        totalItems: Number(item.total_items || 0),
        registeredQuantity: Number(item.registered_quantity || 0),
        remainingQuantity: Number(item.remaining_quantity || 0),

        detailUrl: item.slug ? `/campaigns/${item.slug}` : '',

        raw: item,
    };
}

function mapCategory(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',

        icon: item.icon || '',
        image: normalizeImage(item.thumbnail),

        childrenCount: Number(item.children_count || 0),

        raw: item,
    };
}

function mapNews(item = {}) {
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

function getCountdownParts(totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return [days, hours, minutes, seconds];
}

export function mapHomeResponse(response = {}) {
    const data = response;

    return {
        featuredProducts: Array.isArray(data.featured_products) ? data.featured_products.map(mapProduct) : [],

        newProducts: Array.isArray(data.new_products) ? data.new_products.map(mapProduct) : [],

        bestSellingProducts: Array.isArray(data.best_selling_products)
            ? data.best_selling_products.map(mapProduct)
            : [],

        topRatedProducts: Array.isArray(data.top_rated_products) ? data.top_rated_products.map(mapProduct) : [],

        activeCampaigns: Array.isArray(data.active_campaigns) ? data.active_campaigns.map(mapCampaign) : [],

        upcomingCampaigns: Array.isArray(data.upcoming_campaigns) ? data.upcoming_campaigns.map(mapCampaign) : [],

        categories: Array.isArray(data.categories) ? data.categories.map(mapCategory) : [],

        newsEvents: Array.isArray(data.news_events) ? data.news_events.map(mapNews) : [],

        trendingKeywords: Array.isArray(data.trending_keywords) ? data.trending_keywords : [],

        cartCount: Number(data.cart_count || 0),

        unreadNotifications: Number(data.unread_notifications || 0),

        raw: data,
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

export function mapCampaignActionResponse(response = {}) {
    return {
        success: Boolean(response.success),
        message: response.message || '',
        data: response.data || null,
        raw: response,
    };
}

export function mapCampaignDetailResponse(response = {}) {
    return mapCampaign(response);
}