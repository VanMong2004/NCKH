function toNumber(value) {
    return Number(value || 0);
}

function toBoolean(value) {
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

export function mapAdminProduct(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',

        category: typeof item.category === 'string' ? item.category : item.category?.name || item.category_name || '',

        thumbnail: normalizeImage(item.thumbnail),

        variantsCount: toNumber(item.variants_count),
        minPrice: toNumber(item.min_price),
        maxPrice: toNumber(item.max_price),
        totalStock: toNumber(item.total_stock),
        soldCount: toNumber(item.sold_count),
        averageRating: toNumber(item.average_rating),
        totalReviews: toNumber(item.total_reviews),

        isActive: toBoolean(item.is_active),
        isFeatured: toBoolean(item.is_featured),

        createdAt: item.created_at || '',

        raw: item,
    };
}

export function mapAdminProductDetail(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',

        categoryId: item.category_id || item.category?.id || '',
        category: item.category || null,

        departmentId: item.department_id || '',
        author: item.author || '',

        isActive: toBoolean(item.is_active),
        isFeatured: toBoolean(item.is_featured),

        images: Array.isArray(item.images)
            ? item.images.map((image) => ({
                  id: image.id,
                  url: normalizeImage(image.url),
                  type: image.type || '',
                  position: toNumber(image.position),
                  raw: image,
              }))
            : [],

        variants: Array.isArray(item.variants)
            ? item.variants.map((variant) => ({
                  id: variant.id,
                  sku: variant.sku || '',
                  size: variant.size || '',
                  color: variant.color || '',
                  price: toNumber(variant.price),
                  stock: toNumber(variant.stock),
                  reservedStock: toNumber(variant.reserved_stock),
                  soldStock: toNumber(variant.sold_stock),
                  attributes: variant.attributes || {},
                  raw: variant,
              }))
            : [],

        raw: item,
    };
}

export function mapAdminProductListResponse(response = {}) {
    const paginator = response.data || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        products: raw.map(mapAdminProduct),
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 10),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminProductDetailResponse(response = {}) {
    return mapAdminProductDetail(response.data || {});
}
