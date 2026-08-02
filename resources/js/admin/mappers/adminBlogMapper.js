function toNumber(value) {
    return Number(value || 0);
}

function normalizeImage(url) {
    if (!url) return '';

    const value = String(url).trim();

    if (!value) return '';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    const normalized = value.replace(/^public\//, '').replace(/^storage\//, '');

    if (normalized.startsWith('uploads/')) {
        return `/storage/${normalized}`;
    }

    return `/${normalized}`;
}

export function mapAdminBlog(item = {}) {
    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        summary: item.summary || '',
        content: item.content || '',
        thumbnail: normalizeImage(item.thumbnail),
        authorId: item.author_id || null,
        authorName: item.author_name || 'Quản trị CTUT UniShop',
        status: item.status || 'draft',
        isFeatured: Boolean(item.is_featured),
        publishedAt: item.published_at || '',
        publishedAtDisplay: item.published_at_display || item.published_at || '',
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        raw: item,
    };
}

export function mapAdminBlogListResponse(response = {}) {
    const payload = response.data || {};
    const raw = Array.isArray(payload.items) ? payload.items : [];
    const meta = payload.meta || {};

    return {
        success: Boolean(response.success),
        message: response.message || '',
        blogs: raw.map(mapAdminBlog),
        meta: {
            currentPage: toNumber(meta.current_page || 1),
            lastPage: toNumber(meta.last_page || 1),
            perPage: toNumber(meta.per_page || raw.length || 10),
            total: toNumber(meta.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminBlogDetailResponse(response = {}) {
    return mapAdminBlog(response.data || {});
}
