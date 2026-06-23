function toNumber(value) {
    return Number(value || 0);
}

function normalizeImage(url) {
    if (!url) return '/images/no-image.png';

    const value = String(url).trim();

    if (!value) return '/images/no-image.png';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

function formatMoney(value) {
    const number = Number(value || 0);

    if (!number) return '0 đ';

    return number.toLocaleString('vi-VN') + ' đ';
}

function getDiscountText(item = {}) {
    const value = toNumber(item.discount_value);

    if (!value) return 'Ưu đãi';

    if (item.discount_type === 'percent') {
        return `Giảm ${value}%`;
    }

    if (item.discount_type === 'fixed') {
        return `Giảm ${formatMoney(value)}`;
    }

    return 'Ưu đãi';
}

function getStatusText(status) {
    if (status === 'active') return 'Đang diễn ra';
    if (status === 'upcoming') return 'Sắp diễn ra';
    if (status === 'ended') return 'Đã kết thúc';

    return 'Khuyến mãi';
}

export function getCountdownParts(totalSeconds) {
    const safeSeconds = Math.max(0, toNumber(totalSeconds));

    return {
        days: Math.floor(safeSeconds / 86400),
        hours: Math.floor((safeSeconds % 86400) / 3600),
        minutes: Math.floor((safeSeconds % 3600) / 60),
        seconds: Math.floor(safeSeconds % 60),
    };
}

export function mapPromotionItem(item = {}) {
    const product = item.product || {};
    const variant = item.variant || {};

    return {
        id: item.id,

        product: product
            ? {
                  id: product.id,
                  name: product.name || '',
                  slug: product.slug || '',
                  thumbnail: normalizeImage(product.thumbnail),
              }
            : null,

        variant: variant
            ? {
                  id: variant.id,
                  sku: variant.sku || '',
                  size: variant.size || '',
                  color: variant.color || '',
                  attributes: variant.attributes || null,
                  price: toNumber(variant.price),
              }
            : null,

        discountType: item.discount_type || '',
        discountValue: toNumber(item.discount_value),

        limitQuantity: item.limit_quantity,
        soldQuantity: toNumber(item.sold_quantity),
        reservedQuantity: toNumber(item.reserved_quantity),
        remainingQuantity: item.remaining_quantity,

        isActive: Boolean(item.is_active),

        raw: item,
    };
}

export function mapPromotion(item = {}) {
    const computedStatus = item.computed_status || item.status || '';

    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        description: item.description || '',

        banner: normalizeImage(item.banner),
        thumbnail: normalizeImage(item.thumbnail || item.banner),
        image: normalizeImage(item.thumbnail || item.banner),

        discountType: item.discount_type || '',
        discountValue: toNumber(item.discount_value),
        discountText: getDiscountText(item),

        startDate: item.start_date || '',
        endDate: item.end_date || '',

        status: item.status || '',
        computedStatus,
        statusText: getStatusText(computedStatus),

        countdownSeconds: toNumber(item.countdown_seconds),
        countdown: getCountdownParts(item.countdown_seconds),

        totalItems: toNumber(item.total_items),

        items: Array.isArray(item.items) ? item.items.map(mapPromotionItem) : [],

        isActive: computedStatus === 'active',
        isUpcoming: computedStatus === 'upcoming',
        isEnded: computedStatus === 'ended',

        raw: item,
    };
}

export function mapPromotionListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        promotions: raw.map(mapPromotion),
        meta: {
            currentPage: toNumber(response.meta?.current_page || 1),
            lastPage: toNumber(response.meta?.last_page || 1),
            perPage: toNumber(response.meta?.per_page || raw.length || 10),
            total: toNumber(response.meta?.total || raw.length),
        },
        raw: response,
    };
}

export function mapPromotionDetailResponse(response = {}) {
    return mapPromotion(response.data || {});
}
