function toNumber(value) {
    return Number(value || 0);
}

export function mapAdminPolicy(item = {}) {
    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        type: item.type || 'policy',
        content: item.content || '',
        contentPreview: item.content_preview || '',
        sortOrder: toNumber(item.sort_order),
        isActive: Boolean(item.is_active),
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        raw: item,
    };
}

export function mapAdminPolicyListResponse(response = {}) {
    const payload = response.data || {};
    const raw = Array.isArray(payload.items) ? payload.items : [];
    const meta = payload.meta || {};

    return {
        success: Boolean(response.success),
        message: response.message || '',
        policies: raw.map(mapAdminPolicy),
        meta: {
            currentPage: toNumber(meta.current_page || 1),
            lastPage: toNumber(meta.last_page || 1),
            perPage: toNumber(meta.per_page || raw.length || 10),
            total: toNumber(meta.total || raw.length),
        },
        nextSortOrder: toNumber(payload.next_sort_order || 1),
        raw: response,
    };
}

export function mapAdminPolicyDetailResponse(response = {}) {
    return mapAdminPolicy(response.data || {});
}
