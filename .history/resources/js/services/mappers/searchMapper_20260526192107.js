export function mapSearchSuggestion(item = {}) {
    if (typeof item === 'string') {
        return {
            id: item,
            type: 'keyword',
            label: item,
            keyword: item,
            url: `/shop?keyword=${encodeURIComponent(item)}`,
            raw: item,
        };
    }

    const label = item.keyword || item.name || item.title || item.label || '';

    const type = item.type || 'keyword';

    return {
        id: item.id || `${type}-${label}`,
        type,
        label,
        keyword: item.keyword || label,
        name: item.name || label,
        title: item.title || label,
        slug: item.slug || '',
        image: item.thumbnail || item.image || '',
        url: item.url || getSearchUrl(type, item, label),
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

    return {
        id: item.id,
        keyword: item.keyword || item.query || item.name || '',
        label: item.keyword || item.query || item.name || '',
        createdAt: item.created_at || item.createdAt || '',
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

function getSearchUrl(type, item, label) {
    const normalizedType = String(type || '').toLowerCase();

    if (normalizedType.includes('product') && item.slug) {
        return `/products/${item.slug}`;
    }

    if (normalizedType.includes('campaign') && item.slug) {
        return `/campaigns/${item.slug}`;
    }

    if ((normalizedType.includes('blog') || normalizedType.includes('news')) && item.slug) {
        return `/blog/${item.slug}`;
    }

    return `/shop?keyword=${encodeURIComponent(label || '')}`;
}
