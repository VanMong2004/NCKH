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
    const paginator = response.data || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        policies: raw.map(mapAdminPolicy),
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 10),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminPolicyDetailResponse(response = {}) {
    return mapAdminPolicy(response.data || {});
}
