function toNumber(value) {
    return Number(value || 0);
}

export function formatMoney(value) {
    const number = Number(value || 0);

    if (number <= 0) return 'Liên hệ';

    return number.toLocaleString('vi-VN') + ' đ';
}

function formatPriceRange(min, max) {
    const minPrice = toNumber(min);
    const maxPrice = toNumber(max);

    if (!minPrice && !maxPrice) return 'Liên hệ';
    if (!maxPrice || minPrice === maxPrice) return formatMoney(minPrice);

    return `${formatMoney(minPrice)} - ${formatMoney(maxPrice)}`;
}

function mapCategory(category) {
    if (!category) return null;

    return {
        id: category.id,
        name: category.name || '',
        slug: category.slug || '',
        parent: category.parent
            ? {
                  id: category.parent.id,
                  name: category.parent.name || '',
                  slug: category.parent.slug || '',
              }
            : null,
        raw: category,
    };
}

function mapImage(image = {}) {
    return {
        url: image.url || '',
        type: image.type || '',
        raw: image,
    };
}

function mapDepartment(item = {}) {
    const name =
        item.department?.name ||
        item.faculty?.name ||
        item.khoa?.tenkhoa ||
        item.department_name ||
        item.faculty_name ||
        item.ten_khoa ||
        item.tenkhoa ||
        '';

    const code =
        item.department?.code ||
        item.faculty?.code ||
        item.khoa?.makhoa ||
        item.department_code ||
        item.faculty_code ||
        item.ma_khoa ||
        item.makhoa ||
        '';

    if (!name && !code) return null;

    return {
        id: item.department?.id || item.faculty?.id || item.khoa?.id || item.department_id || null,
        name,
        code,
        raw: item.department || item.faculty || item.khoa || null,
    };
}

function mapVariant(variant = {}) {
    const originalPrice = toNumber(variant.original_price || variant.price);
    const finalPrice = toNumber(variant.price || variant.final_price);
    const discountAmount = toNumber(variant.discount_amount);
    const promotionPrice = toNumber(variant.promotion_price);

    const hasPromotion = Boolean(
        variant.has_promotion ||
        discountAmount > 0 ||
        (originalPrice > 0 && finalPrice > 0 && originalPrice > finalPrice),
    );

    const availableStock = toNumber(
        variant.available_stock ?? Math.max(0, toNumber(variant.stock) - toNumber(variant.reserved_stock)),
    );

    return {
        id: variant.id,
        size: variant.size || '',
        color: variant.color || '',
        sku: variant.sku || '',

        attributes: variant.attributes || null,

        price: finalPrice,
        finalPrice,
        originalPrice,
        discountAmount,
        promotionPrice,

        hasPromotion,
        promotionLoginRequired: Boolean(variant.promotion_login_required),
        promotion: variant.promotion || null,

        stock: toNumber(variant.stock),
        reservedStock: toNumber(variant.reserved_stock),
        soldStock: toNumber(variant.sold_stock),
        availableStock,
        inStock: availableStock > 0,

        raw: variant,
    };
}

function getPriceFields(item = {}) {
    const priceMin = toNumber(item.min_price ?? item.price_min);
    const priceMax = toNumber(item.max_price ?? item.price_max);

    const originalMinPrice = toNumber(item.original_min_price || priceMin);
    const originalMaxPrice = toNumber(item.original_max_price || priceMax);

    const promotionMinPrice = toNumber(item.promotion_min_price);
    const promotionMaxPrice = toNumber(item.promotion_max_price);

    const hasPromotion = Boolean(
        item.has_promotion ||
        promotionMinPrice > 0 ||
        promotionMaxPrice > 0 ||
        (originalMinPrice > 0 && priceMin > 0 && originalMinPrice > priceMin) ||
        (originalMaxPrice > 0 && priceMax > 0 && originalMaxPrice > priceMax),
    );

    return {
        priceMin,
        priceMax,
        originalMinPrice,
        originalMaxPrice,
        promotionMinPrice,
        promotionMaxPrice,
        hasPromotion,
        priceText: formatPriceRange(priceMin, priceMax),
        originalPriceText: hasPromotion ? formatPriceRange(originalMinPrice, originalMaxPrice) : '',
    };
}

/**
 * GET /api/products
 */
export function mapProductListItem(item = {}) {
    const price = getPriceFields(item);
    const department = mapDepartment(item);

    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',

        thumbnail: item.thumbnail || '',
        image: item.thumbnail || '',

        category: mapCategory(item.category),
        categoryName: item.category?.name || '',

        department,
        departmentName: department?.name || '',
        departmentCode: department?.code || '',

        priceMin: price.priceMin,
        priceMax: price.priceMax,
        originalMinPrice: price.originalMinPrice,
        originalMaxPrice: price.originalMaxPrice,
        promotionMinPrice: price.promotionMinPrice,
        promotionMaxPrice: price.promotionMaxPrice,
        priceText: price.priceText,
        originalPriceText: price.originalPriceText,

        hasPromotion: price.hasPromotion,
        promotionLoginRequired: Boolean(item.promotion_login_required),

        averageRating: toNumber(item.average_rating || item.rating),
        rating: toNumber(item.average_rating || item.rating),

        totalReviews: toNumber(item.total_reviews || item.review_count),
        reviews: toNumber(item.total_reviews || item.review_count),

        sold: toNumber(item.sold || item.sold_count),

        inStock: Boolean(item.in_stock),
        stock: toNumber(item.available_stock || item.stock),
        availableStock: toNumber(item.available_stock || item.stock),

        isFeatured: Boolean(item.is_featured),
        isActive: Boolean(item.is_active),

        raw: item,
    };
}

/**
 * GET /api/products/{slug}
 */
export function mapProductDetailItem(item = {}) {
    const price = getPriceFields(item);
    const department = mapDepartment(item);

    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',

        thumbnail: item.thumbnail || '',
        image: item.thumbnail || '',
        images: Array.isArray(item.images) ? item.images.map(mapImage) : [],

        category: mapCategory(item.category),
        categoryName: item.category?.name || '',

        department,
        departmentName: department?.name || '',
        departmentCode: department?.code || '',

        priceMin: price.priceMin,
        priceMax: price.priceMax,
        originalMinPrice: price.originalMinPrice,
        originalMaxPrice: price.originalMaxPrice,
        promotionMinPrice: price.promotionMinPrice,
        promotionMaxPrice: price.promotionMaxPrice,
        priceText: price.priceText,
        originalPriceText: price.originalPriceText,

        hasPromotion: price.hasPromotion,
        promotionLoginRequired: Boolean(item.promotion_login_required),

        rating: toNumber(item.rating || item.average_rating),
        averageRating: toNumber(item.average_rating || item.rating),
        reviewCount: toNumber(item.review_count || item.total_reviews),
        totalReviews: toNumber(item.total_reviews || item.review_count),

        sold: toNumber(item.sold || item.sold_count),

        stock: toNumber(item.stock || item.available_stock),
        availableStock: toNumber(item.available_stock || item.stock),
        inStock: Boolean(item.in_stock),

        isFeatured: Boolean(item.is_featured),
        isActive: Boolean(item.is_active),

        variants: Array.isArray(item.variants) ? item.variants.map(mapVariant) : [],

        availableSizes: Array.isArray(item.available_sizes) ? item.available_sizes.filter(Boolean) : [],
        availableColors: Array.isArray(item.available_colors) ? item.available_colors.filter(Boolean) : [],

        ratingBreakdown: item.rating_breakdown || {},

        relatedProducts: Array.isArray(item.related_products) ? item.related_products.map(mapProductListItem) : [],

        reviewsList: Array.isArray(item.reviews) ? item.reviews : [],

        raw: item,
    };
}

export function mapProduct(item) {
    return mapProductListItem(item);
}

export function mapProductListResponse(response = {}) {
    const rawProducts = Array.isArray(response.data) ? response.data : [];
    const filters = response.filters || {};
    const priceRange = filters.price_range || {};

    return {
        success: Boolean(response.success),
        message: response.message || '',

        products: rawProducts.map(mapProductListItem),

        meta: {
            currentPage: toNumber(response.meta?.current_page || 1),
            lastPage: toNumber(response.meta?.last_page || 1),
            perPage: toNumber(response.meta?.per_page || 12),
            total: toNumber(response.meta?.total || rawProducts.length),
        },

        filters: {
            sizes: Array.isArray(filters.sizes) ? filters.sizes.filter(Boolean) : [],
            colors: Array.isArray(filters.colors) ? filters.colors.filter(Boolean) : [],
            priceRange: {
                min: toNumber(priceRange.min),
                max: toNumber(priceRange.max),
            },
            categories: Array.isArray(filters.categories) ? filters.categories : [],
        },

        raw: response,
    };
}

export function mapProductDetailResponse(response = {}) {
    return mapProductDetailItem(response.data || {});
}
