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

    if (!number) return '';

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(number);
}

function getProductPriceText(product = {}) {
    const minPrice = Number(product.min_price || 0);
    const maxPrice = Number(product.max_price || 0);

    if (!minPrice && !maxPrice) return '';

    if (minPrice && maxPrice && minPrice !== maxPrice) {
        return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    }

    return formatCurrency(minPrice || maxPrice);
}

/**
 * GET /api/search/suggestions?keyword=...
 *
 * BE trả item:
 * id, name, slug, thumbnail, average_rating
 */
export function mapSearchSuggestion(item = {}) {
    return {
        id: item.id,
        type: 'product',

        label: item.name || '',
        keyword: item.name || '',
        name: item.name || '',
        title: item.name || '',

        slug: item.slug || '',
        image: normalizeImage(item.thumbnail),

        rating: Number(item.average_rating || 0),

        priceText: '',

        url: item.slug ? `/products/${item.slug}` : '',

        raw: item,
    };
}

/**
 * Fallback từ GET /api/products?keyword=...
 *
 * BE product list thường trả:
 * id, name, slug, thumbnail, min_price, max_price, average_rating
 */
export function mapProductToSearchSuggestion(product = {}) {
    return {
        id: product.id,
        type: 'product',

        label: product.name || '',
        keyword: product.name || '',
        name: product.name || '',
        title: product.name || '',

        slug: product.slug || '',
        image: normalizeImage(product.thumbnail),

        rating: Number(product.average_rating || 0),

        priceText: getProductPriceText(product),

        url: product.slug ? `/products/${product.slug}` : '',

        raw: product,
    };
}

/**
 * GET /api/search/history
 *
 * BE history item dự kiến:
 * id, keyword, created_at, updated_at
 */
export function mapSearchHistory(item = {}) {
    return {
        id: item.id,
        keyword: item.keyword || '',
        label: item.keyword || '',
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        raw: item,
    };
}

export function mapSearchSuggestionsResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map(mapSearchSuggestion).filter((item) => item.id && item.name && item.slug);
}

export function mapProductFallbackResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map(mapProductToSearchSuggestion).filter((item) => item.id && item.name && item.slug);
}

export function mapSearchHistoryResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map(mapSearchHistory).filter((item) => item.id && item.keyword);
}

export function mapSearchActionResponse(response = {}) {
    return {
        success: Boolean(response.success),
        message: response.message || '',
        data: response.data || null,
        raw: response,
    };
}
