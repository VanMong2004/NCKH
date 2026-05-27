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

function mapProduct(item = {}) {
    const minPrice = Number(item.min_price || item.price || 0);
    const maxPrice = Number(item.max_price || item.price || minPrice || 0);

    let priceText = formatCurrency(minPrice);

    if (minPrice && maxPrice && minPrice !== maxPrice) {
        priceText = `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    }

    const image =
        item.thumbnail || item.image || item.images?.[0]?.url || item.images?.[0]?.image || '/images/no-image.png';

    const categoryName =
        typeof item.category === 'string' ? item.category : item.category?.name || item.category_name || 'Sản phẩm';

    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || item.id,
        image: normalizeImage(image),
        categoryName,
        priceText,
        rating: Number(item.average_rating || item.rating || 0),
        reviews: Number(item.total_reviews || item.reviews || 0),
        sold: Number(item.sold || item.sold_count || item.sold_stock || 0),
        inStock: Boolean(item.in_stock ?? item.available_stock > 0 ?? true),
        label: item.is_featured ? 'Nổi bật' : '',
        raw: item,
    };
}

function mapCampaign(item = {}) {
    const seconds = Math.max(0, Number(item.countdown_seconds || 0));

    const image = item.thumbnail || item.banner || item.image || '/images/no-image.png';

    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || item.id,
        description: item.description || '',
        image: normalizeImage(image),
        status: item.status || 'active',
        limit: Number(item.limit || 0),
        startDate: item.start_date || '',
        endDate: item.end_date || '',
        countdownSeconds: seconds,
        time: getCountdownParts(seconds),
        detailUrl: `/campaigns/${item.slug || item.id}`,
        raw: item,
    };
}

function mapCategory(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',
        icon: item.icon || '',
        image: normalizeImage(item.thumbnail || item.image || ''),
        childrenCount: Number(item.children_count || 0),
        raw: item,
    };
}

function mapNews(item = {}) {
    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || item.id,
        description: item.excerpt || item.summary || item.description || '',
        image: normalizeImage(item.thumbnail || item.image || ''),
        date: item.published_at || item.created_at || '',
        category: item.category || 'Tin tức',
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
    const data = response.data || response;

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
        slug: blog.slug || blog.id,
        description: blog.excerpt || '',
        image: normalizeImage(blog.thumbnail),
        date: blog.publishedAt || '',
        category: blog.category || 'Tin tức',
        raw: blog,
    };
}
