export function mapCampaign(item = {}) {
    const registered = Number(item.registered_quantity || 0);
    const remaining = Number(item.remaining_quantity || 0);
    const total = registered + remaining;

    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        description: item.description || '',

        banner: item.banner || '',
        thumbnail: item.thumbnail || item.banner || '/images/no-image.png',

        startDate: item.start_date || '',
        endDate: item.end_date || '',

        status: item.status || 'upcoming',
        statusText: campaignStatusText(item.status),

        countdownSeconds: Number(item.countdown_seconds || 0),

        totalItems: Number(item.total_items || item.items_count || 0),

        registeredQuantity: registered,
        remainingQuantity: remaining,
        totalQuantity: total,

        progress: total > 0 ? Math.round((registered / total) * 100) : 0,

        items: Array.isArray(item.items) ? item.items.map(mapCampaignItem) : [],

        raw: item,
    };
}

export function mapCampaignItem(item = {}) {
    const product = item.product || item.product_variant?.product || {};
    const variant = item.variant || item.product_variant || {};

    return {
        id: item.id,
        price: Number(item.price || 0),

        limitQuantity: Number(item.limit_quantity || 0),
        registeredQuantity: Number(item.registered_quantity || 0),
        remainingQuantity: Number(item.remaining_quantity || 0),

        product: {
            id: product.id,
            name: product.name || '',
            slug: product.slug || '',
            thumbnail: product.thumbnail || '/images/no-image.png',
        },

        variant: {
            id: variant.id,
            sku: variant.sku || '',
            size: variant.size || '',
            color: variant.color || '',
            stock: Number(variant.stock || 0),
        },

        raw: item,
    };
}

export function mapCampaignListResponse(response = {}) {
    const raw = response.data || [];

    return {
        campaigns: Array.isArray(raw) ? raw.map(mapCampaign) : [],

        meta: {
            currentPage: Number(response.meta?.current_page || 1),
            lastPage: Number(response.meta?.last_page || 1),
            perPage: Number(response.meta?.per_page || 10),
            total: Number(response.meta?.total || raw.length || 0),
        },
    };
}

export function mapCampaignDetailResponse(response = {}) {
    return mapCampaign(response.data || response.campaign || response);
}

export function campaignStatusText(status) {
    const map = {
        active: 'Đang mở',
        upcoming: 'Sắp mở',
        ended: 'Đã kết thúc',
    };

    return map[status] || 'Không xác định';
}
