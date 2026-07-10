function toNumber(value) {
    return Number(value || 0);
}

function toBoolean(value) {
    return value === true || value === 1 || value === '1';
}

function emptyToNull(value) {
    if (value === '' || value === undefined || value === null) return null;
    return value;
}

function normalizeBoolean(value) {
    return value === true || value === 1 || value === '1';
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

export function formatMoney(value) {
    return toNumber(value).toLocaleString('vi-VN') + ' đ';
}

export function createSlug(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function getDiscountText(type, value) {
    const number = toNumber(value);

    if (type === 'percent') return `Giảm ${number}%`;
    if (type === 'fixed') return `Giảm ${formatMoney(number)}`;

    return 'Theo khuyến mãi chính';
}

function getStatusText(status) {
    if (status === 'draft') return 'Bản nháp';
    if (status === 'active') return 'Đang bật';
    if (status === 'inactive') return 'Đã tắt';
    if (status === 'upcoming') return 'Sắp diễn ra';
    if (status === 'ended') return 'Đã kết thúc';

    return 'Không rõ';
}

function toDatetimeLocal(value) {
    if (!value) return '';

    const raw = String(value).trim();

    const viMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
    if (viMatch) {
        const [, day, month, year, hour, minute] = viMatch;
        return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
        return raw.slice(0, 16);
    }

    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(raw)) {
        return raw.replace(' ', 'T').slice(0, 16);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return `${raw}T00:00`;
    }

    return '';
}

function formatDateDisplay(value) {
    if (!value) return '';

    const raw = String(value).trim();
    const viMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    if (viMatch) {
        const [, day, month, year] = viMatch;
        return `${day}/${month}/${year}`;
    }

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return `${day}/${month}/${year}`;
    }

    return raw;
}

export function mapAdminPromotion(item = {}) {
    const status = item.status || '';
    const computedStatus = item.computed_status || status;

    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        description: item.description || '',

        banner: normalizeImage(item.banner),
        thumbnail: normalizeImage(item.thumbnail),

        discountType: item.discount_type || '',
        discountValue: toNumber(item.discount_value),
        discountText: getDiscountText(item.discount_type, item.discount_value),

        startDate: formatDateDisplay(item.start_date),
        endDate: formatDateDisplay(item.end_date),
        startDateInput: toDatetimeLocal(item.start_date),
        endDateInput: toDatetimeLocal(item.end_date),

        status,
        statusText: getStatusText(status),

        computedStatus,
        computedStatusText: getStatusText(computedStatus),

        isActive: toBoolean(item.is_active),

        itemsCount: toNumber(item.items_count || item.total_items),
        createdAt: item.created_at || '',

        raw: item,
    };
}

export function mapAdminPromotionItem(item = {}) {
    const product = item.product || {};
    const variant = item.variant || {};

    return {
        id: item.id,

        productId: item.product_id || product.id || '',
        productName: product.name || item.product_name || '',
        productSlug: product.slug || '',
        productThumbnail: normalizeImage(product.thumbnail || item.thumbnail),

        productVariantId: item.product_variant_id || variant.id || '',
        variantSku: variant.sku || item.sku || '',
        variantSize: variant.size || '',
        variantColor: variant.color || '',
        variantPrice: toNumber(variant.price),

        discountType: item.discount_type || '',
        discountValue:
            item.discount_value === null || item.discount_value === undefined ? '' : toNumber(item.discount_value),
        discountText: getDiscountText(item.discount_type, item.discount_value),

        limitQuantity:
            item.limit_quantity === null || item.limit_quantity === undefined ? '' : toNumber(item.limit_quantity),
        soldQuantity: toNumber(item.sold_quantity),
        reservedQuantity: toNumber(item.reserved_quantity),
        remainingQuantity:
            item.remaining_quantity === null || item.remaining_quantity === undefined
                ? null
                : toNumber(item.remaining_quantity),

        isActive: toBoolean(item.is_active),

        raw: item,
    };
}

export function mapAvailablePromotionVariant(product = {}, variant = {}) {
    return {
        id: variant.id,
        productId: product.id,
        productName: product.name || '',
        productSlug: product.slug || '',
        productCategory: product.category || '',
        productThumbnail: normalizeImage(product.thumbnail),

        sku: variant.sku || '',
        size: variant.size || '',
        color: variant.color || '',

        price: toNumber(variant.price),
        stock: toNumber(variant.stock),
        reservedStock: toNumber(variant.reserved_stock),
        availableStock: toNumber(variant.available_stock),

        isActive: toBoolean(variant.is_active),
        alreadyAdded: toBoolean(variant.already_added),

        label: buildVariantLabel(variant),
        raw: variant,
    };
}

export function mapAvailablePromotionProduct(item = {}) {
    const variants = Array.isArray(item.variants)
        ? item.variants.map((variant) => mapAvailablePromotionVariant(item, variant))
        : [];

    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',
        category: item.category || '',
        thumbnail: normalizeImage(item.thumbnail),
        isActive: toBoolean(item.is_active),
        variants,
        raw: item,
    };
}

export function mapAdminPromotionListResponse(response = {}) {
    const paginator = response.data || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        promotions: raw.map(mapAdminPromotion),
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 10),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminPromotionDetailResponse(response = {}) {
    return mapAdminPromotion(response.data || {});
}

export function mapAdminPromotionItemsResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        items: raw.map(mapAdminPromotionItem),
        raw: response,
    };
}

export function mapAvailablePromotionProductsResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];
    const meta = response.meta || {};

    return {
        success: Boolean(response.success),
        message: response.message || '',
        products: raw.map(mapAvailablePromotionProduct),
        meta: {
            currentPage: toNumber(meta.current_page || 1),
            lastPage: toNumber(meta.last_page || 1),
            perPage: toNumber(meta.per_page || raw.length || 10),
            total: toNumber(meta.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminPromotionToForm(promotion = null) {
    if (!promotion) {
        return {
            title: '',
            slug: '',
            description: '',

            banner: '',
            thumbnail: '',
            bannerFile: null,
            thumbnailFile: null,

            discount_type: 'percent',
            discount_value: '',

            start_date: '',
            end_date: '',

            status: 'draft',
            is_active: true,
        };
    }

    return {
        title: promotion.title || '',
        slug: promotion.slug || createSlug(promotion.title),

        description: promotion.description || '',

        banner: promotion.banner || '',
        thumbnail: promotion.thumbnail || '',
        bannerFile: null,
        thumbnailFile: null,

        discount_type: promotion.discountType || promotion.raw?.discount_type || 'percent',
        discount_value: promotion.discountValue || promotion.raw?.discount_value || '',

        start_date: promotion.startDateInput || toDatetimeLocal(promotion.raw?.start_date),
        end_date: promotion.endDateInput || toDatetimeLocal(promotion.raw?.end_date),

        status: promotion.status || 'draft',
        is_active: Boolean(promotion.isActive),
    };
}

export function normalizeAdminPromotionPayload(payload = {}) {
    const title = payload.title || '';
    const slug = payload.slug || createSlug(title);

    return {
        title,
        slug,
        description: emptyToNull(payload.description),

        discount_type: payload.discount_type || 'percent',
        discount_value: Number(payload.discount_value || 0),

        start_date: payload.start_date || '',
        end_date: payload.end_date || '',

        status: payload.status || 'draft',
        is_active: normalizeBoolean(payload.is_active),
    };
}

export function normalizeAdminPromotionItemPayload(payload = {}) {
    return {
        product_id: payload.product_id,
        product_variant_id: payload.product_variant_id || null,

        discount_type: payload.discount_type || null,
        discount_value:
            payload.discount_value === '' || payload.discount_value === null || payload.discount_value === undefined
                ? null
                : Number(payload.discount_value),

        limit_quantity:
            payload.limit_quantity === '' || payload.limit_quantity === null || payload.limit_quantity === undefined
                ? null
                : Number(payload.limit_quantity),

        is_active: normalizeBoolean(payload.is_active),
    };
}

export function normalizePromotionBulkItemsPayload(payload = {}) {
    const items = Array.isArray(payload.items) ? payload.items : [];

    return {
        items: items.map((item) => normalizeAdminPromotionItemPayload(item)),
    };
}

function buildVariantLabel(variant = {}) {
    const parts = [];

    if (variant.sku) parts.push(variant.sku);
    if (variant.size) parts.push(`Size ${variant.size}`);
    if (variant.color) parts.push(variant.color);

    return parts.length ? parts.join(' · ') : `Phân loại #${variant.id}`;
}
