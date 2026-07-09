function toNumber(value) {
    return Number(value || 0);
}

function toBoolean(value) {
    return value === true || value === 1 || value === '1';
}

export function mapAdminCategory(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',
        parentId: item.parent_id || '',
        parentName: item.parent_name || '',
        description: item.description || '',
        image: item.image || '',
        icon: item.icon || '',
        isActive: toBoolean(item.is_active),
        sortOrder: toNumber(item.sort_order),
        productsCount: toNumber(item.products_count),
        childrenCount: toNumber(item.children_count),
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        raw: item,
    };
}

export function mapCategoryOption(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',
        parentId: item.parent_id || '',
    };
}

export function mapAdminCategoryListResponse(response = {}) {
    const data = response.data || {};
    const paginator = data.categories || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        categories: raw.map(mapAdminCategory),
        parents: Array.isArray(data.parents) ? data.parents.map(mapCategoryOption) : [],
        stats: {
            total: toNumber(data.stats?.total),
            active: toNumber(data.stats?.active),
            inactive: toNumber(data.stats?.inactive),
            parents: toNumber(data.stats?.parents),
            children: toNumber(data.stats?.children),
        },
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 10),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminCategoryDetailResponse(response = {}) {
    return mapAdminCategory(response.data || {});
}

export function mapCategoryOptionsResponse(response = {}) {
    return Array.isArray(response.data) ? response.data.map(mapCategoryOption) : [];
}
