function normalizeImage(url) {
    if (!url) return '/images/no-image.png';

    const value = String(url).trim();

    if (!value) return '/images/no-image.png';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

export function mapSearchSuggestion(item = {}) {
    if (typeof item === 'string') {
        return {
            id: item,
            type: 'keyword',
            label: item,
            keyword: item,
            name: item,
            slug: '',
            image: '/images/no-image.png',
            rating: 0,
            priceText: '',
            url: `/shop?keyword=${encodeURIComponent(item)}`,
            raw: item,
        };
    }

    const name = item.name || item.title || item.keyword || item.label || '';
    const slug = item.slug || '';
    const isProduct = Boolean(item.id && item.name && item.slug);

    return {
        id: item.id || `${isProduct ? 'product' : 'keyword'}-${name}`,
        type: isProduct ? 'product' : item.type || 'keyword',
        label: name,
        keyword: item.keyword || name,
        name,
        title: item.title || name,
        slug,
        image: normalizeImage(item.thumbnail || item.image),
        rating: Number(item.average_rating || item.rating || 0),
        priceText: getPriceText(item),
        url: isProduct ? `/products/${slug}` : `/shop?keyword=${encodeURIComponent(name)}`,
        raw: item,
    };
}

export function mapProductToSearchSuggestion(item = {}) {
    const name = item.name || '';
    const slug = item.slug || '';

    const image = item.thumbnail || item.image || item.images?.[0]?.url || item.images?.[0]?.image || '';

    return {
        id: item.id,
        type: 'product',
        label: name,
        keyword: name,
        name,
        title: name,
        slug,
        image: normalizeImage(image),
        rating: Number(item.average_rating || item.rating || 0),
        priceText: getPriceText(item),
        url: slug ? `/products/${slug}` : `/shop?keyword=${encodeURIComponent(name)}`,
        raw: item,
    };
}

export function mapSearchHistory(item = {}) {
    if (typeof item === 'string') {
        return {
            id: item,
            keyword: item,
            label: item,
            createdAt: '',
            updatedAt: '',
            raw: item,
        };
    }

    const keyword = item.keyword || item.query || item.name || '';

    return {
        id: item.id,
        keyword,
        label: keyword,
        createdAt: item.created_at || item.createdAt || '',
        updatedAt: item.updated_at || item.updatedAt || '',
        raw: item,
    };
}

export function mapSearchSuggestionsResponse(response = {}) {
    const raw = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.suggestions)
          ? response.suggestions
          : [];

    return raw.map(mapSearchSuggestion).filter((item) => item.label || item.keyword);
}

export function mapProductFallbackResponse(response = {}) {
    const raw = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.products)
            ? response.products
            : [];

    return raw.map(mapProductToSearchSuggestion).filter((item) => item.label && item.slug);
}

export function mapSearchHistoryResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : Array.isArray(response.history) ? response.history : [];

    return raw.map(mapSearchHistory).filter((item) => item.keyword || item.label);
}

export function mapSearchActionResponse(response = {}) {
    return {
        success: Boolean(response.success ?? true),
        message: response.message || '',
        data: response.data || null,
        raw: response,
    };
}

function getPriceText(item = {}) {
    const minPrice = Number(item.min_price || item.price || 0);
    const maxPrice = Number(item.max_price || item.price || minPrice || 0);

    if (!minPrice && !maxPrice) return '';

    if (minPrice && maxPrice && minPrice !== maxPrice) {
        return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    }

    return formatCurrency(minPrice || maxPrice);
}

function formatCurrency(value) {
    const number = Number(value || 0);

    if (!number) return '';

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(number);
}
