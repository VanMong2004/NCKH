function toNumber(value) {
    return Number(value || 0);
}

function toBoolean(value) {
    return value === true || value === 1 || value === '1';
}

export function mapAdminDepartment(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        slug: item.slug || '',
        description: item.description || '',
        isActive: toBoolean(item.is_active),
        sortOrder: toNumber(item.sort_order),
        productsCount: toNumber(item.products_count),
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        raw: item,
    };
}

export function mapDepartmentOption(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        slug: item.slug || '',
    };
}

export function mapAdminDepartmentListResponse(response = {}) {
    const data = response.data || {};
    const paginator = data.departments || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        departments: raw.map(mapAdminDepartment),
        stats: {
            total: toNumber(data.stats?.total),
            active: toNumber(data.stats?.active),
            inactive: toNumber(data.stats?.inactive),
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

export function mapAdminDepartmentDetailResponse(response = {}) {
    return mapAdminDepartment(response.data || {});
}

export function mapDepartmentOptionsResponse(response = {}) {
    return Array.isArray(response.data) ? response.data.map(mapDepartmentOption) : [];
}
