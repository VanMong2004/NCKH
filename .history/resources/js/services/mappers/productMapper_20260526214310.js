function toNumber(value) {
    return Number(value || 0);
}

export function formatMoney(value) {
    const number = Number(value || 0);

    if (number <= 0) return 'Liên hệ';

    return number.toLocaleString('vi-VN') + ' đ';
}

function formatPriceRange(min, max) {
    if (!min && !max) return 'Liên hệ';
    if (!max || min === max) return formatMoney(min);

    return `${formatMoney(min)} - ${formatMoney(max)}`;
}

function mapCategory(category) {
    if (!category) return null;

    return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parent: category.parent
            ? {
                  id: category.parent.id,
                  name: category.parent.name,
                  slug: category.parent.slug,
              }
            : null,
        raw: category,
    };
}

function mapImage(image) {
    return {
        url: image.url,
        type: image.type,
        raw: image,
    };
}

function mapVariant(variant) {
    return {
        id: variant.id,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        price: toNumber(variant.price),
        stock: toNumber(variant.stock),
        reservedStock: toNumber(variant.reserved_stock),
        soldStock: toNumber(variant.sold_stock),
        raw: variant,
    };
}

/**
 * GET /api/products
 */
export function mapProductListItem(item) {
    const priceMin = toNumber(item.min_price);
    const priceMax = toNumber(item.max_price);

    return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,

        thumbnail: item.thumbnail,
        image: item.thumbnail,

        category: mapCategory(item.category),
        categoryName: item.category ? item.category.name : '',

        priceMin,
        priceMax,
        priceText: formatPriceRange(priceMin, priceMax),

        averageRating: toNumber(item.average_rating),
        rating: toNumber(item.average_rating),

        totalReviews: toNumber(item.total_reviews),
        reviews: toNumber(item.total_reviews),

        sold: toNumber(item.sold),

        inStock: Boolean(item.in_stock),
        stock: toNumber(item.available_stock),
        availableStock: toNumber(item.available_stock),

        raw: item,
    };
}

/**
 * GET /api/products/{slug}
 */
export function mapProductDetailItem(item) {
    const priceMin = toNumber(item.price_min);
    const priceMax = toNumber(item.price_max);

    return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,

        thumbnail: item.thumbnail,
        image: item.thumbnail,
        images: Array.isArray(item.images) ? item.images.map(mapImage) : [],

        category: mapCategory(item.category),
        categoryName: item.category ? item.category.name : '',

        priceMin,
        priceMax,
        priceText: formatPriceRange(priceMin, priceMax),

        rating: toNumber(item.rating),
        averageRating: toNumber(item.average_rating),
        reviewCount: toNumber(item.review_count),
        totalReviews: toNumber(item.total_reviews),

        sold: toNumber(item.sold),

        stock: toNumber(item.stock),
        inStock: Boolean(item.in_stock),

        isFeatured: Boolean(item.is_featured),
        isActive: Boolean(item.is_active),

        variants: Array.isArray(item.variants) ? item.variants.map(mapVariant) : [],

        availableSizes: Array.isArray(item.available_sizes) ? item.available_sizes : [],
        availableColors: Array.isArray(item.available_colors) ? item.available_colors : [],

        ratingBreakdown: item.rating_breakdown,

        relatedProducts: Array.isArray(item.related_products) ? item.related_products.map(mapProductListItem) : [],

        reviewsList: Array.isArray(item.reviews) ? item.reviews : [],

        raw: item,
    };
}

/**
 * Giữ tên mapProduct cho các component cũ.
 * Mặc định map product dạng danh sách.
 */
export function mapProduct(item) {
    return mapProductListItem(item);
}

export function mapProductListResponse(response) {
    const rawProducts = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message,

        products: rawProducts.map(mapProductListItem),

        meta: {
            currentPage: toNumber(response.meta.current_page),
            lastPage: toNumber(response.meta.last_page),
            perPage: toNumber(response.meta.per_page),
            total: toNumber(response.meta.total),
        },

        filters: {
            sizes: Array.isArray(response.filters.sizes) ? response.filters.sizes : [],
            colors: Array.isArray(response.filters.colors) ? response.filters.colors : [],
            priceRange: {
                min: toNumber(response.filters.price_range.min),
                max: toNumber(response.filters.price_range.max),
            },
            categories: Array.isArray(response.filters.categories) ? response.filters.categories : [],
        },

        raw: response,
    };
}

export function mapProductDetailResponse(response) {
    return mapProductDetailItem(response.data);
}
