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
            image: '',
            rating: 0,
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
        url: isProduct ? `/products/${slug}` : `/shop?keyword=${encodeURIComponent(name)}`,
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
