export function mapPolicy(item = {}) {
    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        type: item.type || '',
        content: item.content || '',
        raw: item,
    };
}

export function mapPolicyListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        policies: raw.map(mapPolicy),
        success: Boolean(response.success ?? true),
        message: response.message || '',
    };
}

export function mapPolicyDetailResponse(response = {}) {
    return mapPolicy(response.data || response.policy || response);
}
