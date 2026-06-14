function toNumber(value) {
    return Number(value || 0);
}

function normalizeImage(url) {
    if (!url) return '/images/no-image.png';

    const value = String(url).trim();

    if (!value) return '/images/no-image.png';

    if (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('/')
    ) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

function formatMoney(value) {
    const number = Number(value || 0);

    if (!number) return '';

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(number);
}

export function campaignStatusText(status) {
    const map = {
        active: 'Đang mở',
        upcoming: 'Sắp mở',
        ended: 'Đã kết thúc',
        closed: 'Đã đóng',

        pending: 'Chờ xử lý',
        approved: 'Đã duyệt',
        rejected: 'Từ chối',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Không xác định';
}

export function myCampaignStatusText(status) {
    const map = {
        pending: 'Chờ xử lý',
        approved: 'Đã duyệt',
        rejected: 'Từ chối',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Không xác định';
}

function getCampaignTotalQuantity(item = {}) {
    const registered = toNumber(item.registered_quantity);
    const remaining = toNumber(item.remaining_quantity);

    return registered + remaining;
}

function mapCampaignProduct(product = {}) {
    return {
        id: product.id,
        name: product.name || '',
        slug: product.slug || '',
        thumbnail: normalizeImage(product.thumbnail),
        averageRating: toNumber(product.average_rating),
        raw: product,
    };
}

function mapCampaignVariant(variant = {}) {
    return {
        id: variant.id,
        sku: variant.sku || '',
        size: variant.size || '',
        color: variant.color || '',
        stock: toNumber(variant.stock),
        raw: variant,
    };
}

export function mapCampaignItem(item = {}) {
    return {
        id: item.id,

        price: toNumber(item.price),
        priceText: formatMoney(item.price),

        limitQuantity: toNumber(item.limit_quantity),
        registeredQuantity: toNumber(item.registered_quantity),
        remainingQuantity: toNumber(item.remaining_quantity),

        product: mapCampaignProduct(item.product),

        variant: mapCampaignVariant(item.variant),

        raw: item,
    };
}

export function     mapCampaign(item = {}) {
    const registered = toNumber(item.registered_quantity);
    const remaining = toNumber(item.remaining_quantity);
    const total = getCampaignTotalQuantity(item);

    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        description: item.description || '',

        banner: normalizeImage(item.banner),
        thumbnail: normalizeImage(item.thumbnail),
        image: normalizeImage(item.thumbnail),

        startDate: item.start_date || '',
        endDate: item.end_date || '',

        status: item.status || '',
        statusText: campaignStatusText(item.status),

        countdownSeconds: toNumber(item.countdown_seconds),

        totalItems: toNumber(item.total_items) || (Array.isArray(item.items) ? item.items.length : 0),

        registeredQuantity: registered,
        remainingQuantity: remaining,
        totalQuantity: total,

        progress: total > 0 ? Math.round((registered / total) * 100) : 0,

        items: Array.isArray(item.items) ? item.items.map(mapCampaignItem) : [],

        raw: item,
    };
}

export function mapCampaignListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        campaigns: raw.map(mapCampaign),

        meta: {
            currentPage: toNumber(response.meta?.current_page),
            lastPage: toNumber(response.meta?.last_page),
            perPage: toNumber(response.meta?.per_page),
            total: toNumber(response.meta?.total),
        },

        success: Boolean(response.success),
        message: response.message || '',

        raw: response,
    };
}

/**
 * GET /api/campaigns/{slug}
 * BE trả object campaign trực tiếp, không bọc data.
 */
export function mapCampaignDetailResponse(response = {}) {
    return mapCampaign(response);
}

function mapMyCampaignListItem(item = {}) {
    const items = Array.isArray(item.items) ? item.items.map(mapMyCampaignItem) : [];
    const total = items.reduce((sum, row) => sum + row.total, 0);

    return {
        id: item.id,

        campaignId: item.campaign_id,

        campaignTitle: item.title || '',
        title: item.title || '',
        slug: item.slug || '',

        thumbnail: normalizeImage(item.thumbnail),
        banner: normalizeImage(item.banner),
        image: normalizeImage(item.thumbnail),

        campaignStatus: item.campaign_status || '',
        campaignStatusText: campaignStatusText(item.campaign_status),

        registrationStatus: item.registration_status || '',
        registrationStatusText: myCampaignStatusText(item.registration_status),

        status: item.registration_status || '',
        statusText: myCampaignStatusText(item.registration_status),

        startDate: item.start_date || '',
        endDate: item.end_date || '',

        countdownSeconds: toNumber(item.countdown_seconds),

        quantity: toNumber(item.total_quantity),
        totalQuantity: toNumber(item.total_quantity),
        approvedQuantity: toNumber(item.approved_quantity),
        paidQuantity: toNumber(item.paid_quantity),

        itemCount: items.length,

        total,

        items,

        detailUrl: item.detail_url || '',
        createdAt: item.created_at || '',

        raw: item,
    };
}

function mapMyCampaignItem(item = {}) {
    const price = toNumber(item.price);
    const quantity = toNumber(item.quantity);

    return {
        id: item.id,

        productName: item.product_name || '',

        variant: mapCampaignVariant(item.variant),

        price,
        priceText: formatMoney(price),

        quantity,
        approvedQuantity: toNumber(item.approved_quantity),
        paidQuantity: toNumber(item.paid_quantity),

        status: item.status || '',
        statusText: myCampaignStatusText(item.status),

        total: price * quantity,

        raw: item,
    };
}

export function mapMyCampaignListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        campaigns: raw.map(mapMyCampaignListItem),

        meta: {
            currentPage: toNumber(response.meta?.current_page),
            lastPage: toNumber(response.meta?.last_page),
            perPage: toNumber(response.meta?.per_page),
            total: toNumber(response.meta?.total),
        },

        success: Boolean(response.success),
        message: response.message || '',

        raw: response,
    };
}

function mapMyCampaignCampaign(item = {}) {
    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        description: item.description || '',

        banner: normalizeImage(item.banner),
        thumbnail: normalizeImage(item.thumbnail),
        image: normalizeImage(item.thumbnail),

        limit: toNumber(item.limit),

        startDate: item.start_date || '',
        endDate: item.end_date || '',

        status: item.status || '',
        statusText: campaignStatusText(item.status),

        countdownSeconds: toNumber(item.countdown_seconds),

        raw: item,
    };
}

function mapMyCampaignDetailItem(item = {}) {
    return {
        id: item.id,

        quantity: toNumber(item.quantity),
        approvedQuantity: toNumber(item.approved_quantity),
        paidQuantity: toNumber(item.paid_quantity),
        reservedQuantity: toNumber(item.reserved_quantity),

        status: item.status || '',
        statusText: myCampaignStatusText(item.status),

        product: mapCampaignProduct(item.product),

        variant: mapCampaignVariant(item.variant),

        price: toNumber(item.price),
        priceText: formatMoney(item.price),

        limitQuantity: toNumber(item.limit_quantity),
        registeredQuantity: toNumber(item.registered_quantity),

        orders: Array.isArray(item.orders) ? item.orders : [],

        raw: item,
    };
}

function mapCampaignTimelineItem(item = {}) {
    return {
        label: item.label || '',
        done: Boolean(item.status),
        time: item.time || '',
        raw: item,
    };
}

export function mapMyCampaignDetailResponse(response = {}) {
    const data = response.data || {};

    return {
        id: data.id,

        status: data.status || '',
        statusText: myCampaignStatusText(data.status),

        approvedAt: data.approved_at || '',
        expiresAt: data.expires_at || '',
        createdAt: data.created_at || '',

        campaign: mapMyCampaignCampaign(data.campaign),

        items: Array.isArray(data.items) ? data.items.map(mapMyCampaignDetailItem) : [],

        timeline: Array.isArray(data.timeline)
            ? data.timeline.map(mapCampaignTimelineItem)
            : [],

        raw: data,
    };
}

/**
 * Giữ tên cũ để không vỡ component/service cũ.
 * Với list my-campaign thì dùng mapMyCampaignListItem.
 */
export function mapMyCampaign(item = {}) {
    return mapMyCampaignListItem(item);
}

export function mapCampaignActionResponse(response = {}) {
    return {
        success: Boolean(response.success),
        message: response.message || '',
        data: response.data || null,
        raw: response,
    };
}