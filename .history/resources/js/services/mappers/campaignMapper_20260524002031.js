export function mapCampaign(item = {}) {
    const registered = Number(item.registered_quantity || item.registered || 0);
    const remaining = Number(item.remaining_quantity || item.remaining || 0);
    const total = Number(item.total_quantity || registered + remaining || 0);

    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        description: item.description || '',

        banner: item.banner || item.image || '',
        thumbnail: item.thumbnail || item.banner || item.image || '/images/no-image.png',

        startDate: item.start_date || item.start_at || item.registration_start || item.open_at || '',

        endDate: item.end_date || item.end_at || item.registration_end || item.close_at || '',

        status: item.status || 'upcoming',
        statusText: campaignStatusText(item.status),

        countdownSeconds: Number(item.countdown_seconds || 0),

        totalItems: Number(item.total_items || item.items_count || item.items?.length || 0),

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
        price: Number(item.price || variant.price || 0),

        limitQuantity: Number(item.limit_quantity || 0),
        registeredQuantity: Number(item.registered_quantity || item.registered || 0),
        remainingQuantity: Number(item.remaining_quantity || item.remaining || 0),

        product: {
            id: product.id,
            name: product.name || item.product_name || '',
            slug: product.slug || '',
            thumbnail: product.thumbnail || product.image || item.thumbnail || '/images/no-image.png',
        },

        variant: {
            id: variant.id || item.product_variant_id,
            sku: variant.sku || '',
            size: variant.size || item.size || '',
            color: variant.color || item.color || '',
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
        closed: 'Đã đóng',
    };

    return map[status] || 'Không xác định';
}


export function mapMyCampaign(item = {}) {
    return {
        id: item.id,
        campaignId: item.campaign_id,
        campaignTitle: item.campaign?.title || item.campaign_title || item.title || '',
        status: item.status || 'registered',
        statusText: myCampaignStatusText(item.status),
        quantity: Number(item.quantity || item.total_quantity || 0),
        itemCount: Number(item.item_count || item.items?.length || item.quantity || 0),
        total: Number(item.total || item.total_amount || 0),
        createdAt: item.created_at || '',
        items: item.items || [],
        raw: item,
    };
}

function myCampaignStatusText(status) {
    const map = {
        registered: 'Đã đăng ký',
        pending: 'Chờ xử lý',
        confirmed: 'Đã xác nhận',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || 'Đã đăng ký';
}