export function mapProduct(item = {}) {
    const variants = item.variants || [];

    const priceMin = Number(item.price_min ?? item.min_price ?? item.price ?? variants[0]?.price ?? 0);
    const priceMax = Number(item.price_max ?? item.max_price ?? item.price ?? priceMin);

    const rating = Number(item.rating ?? item.average_rating ?? 0);
    const reviews = Number(item.review_count ?? item.total_reviews ?? item.reviews_count ?? 0);

    const stock = Number(item.stock ?? item.available_stock ?? 0);
    const inStock = Boolean(item.in_stock ?? stock > 0);

    const image =
        item.thumbnail ||
        item.image ||
        item.images?.find?.((img) => img.type === 'thumbnail')?.url ||
        item.images?.[0]?.url ||
        '/images/no-image.png';

    return {
        id: item.id,
        name: item.name || 'Sản phẩm chưa đặt tên',
        slug: item.slug || '',
        description: item.description || '',

        category: item.category || null,
        categoryName: item.category?.name || 'Chưa phân loại',

        image,
        thumbnail: image,
        images: item.images || [],

        priceMin,
        priceMax,
        priceText: formatPriceRange(priceMin, priceMax),

        rating,
        average_rating: rating,
        reviews,
        total_reviews: reviews,
        review_count: reviews,

        sold: Number(item.sold ?? item.sold_count ?? 0),

        stock,
        inStock,
        in_stock: inStock,

        available_sizes: item.available_sizes || uniqueValues(variants, 'size'),
        available_colors: item.available_colors || uniqueValues(variants, 'color'),

        isFeatured: Boolean(item.is_featured),
        is_featured: Boolean(item.is_featured),
        label: item.is_featured ? 'HOT' : '',

        variants,
        related_products: (item.related_products || []).map(mapProduct),

        reviewsList: item.reviews || [],
        reviews: item.reviews || [],

        rating_breakdown: item.rating_breakdown || {},

        raw: item,
    };
}

export function mapProductListResponse(response = {}) {
    const rawProducts = response.data?.data || response.products?.data || response.data || response.products || [];

    return {
        success: Boolean(response.success ?? true),
        message: response.message || '',
        products: Array.isArray(rawProducts) ? rawProducts.map(mapProduct) : [],

        meta: {
            currentPage: Number(response.meta?.current_page || response.meta?.currentPage || 1),
            lastPage: Number(response.meta?.last_page || response.meta?.lastPage || 1),
            perPage: Number(response.meta?.per_page || response.meta?.perPage || 12),
            total: Number(response.meta?.total || rawProducts.length || 0),
        },

        filters: {
            categories: response.filters?.categories || [],
            sizes: response.filters?.sizes || [],
            colors: response.filters?.colors || [],
            priceRange: {
                min: Number(response.filters?.price_range?.min || 0),
                max: Number(response.filters?.price_range?.max || 0),
            },
        },
    };
}

export function mapProductDetailResponse(response = {}) {
    return mapProduct(response.data || response);
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

function uniqueValues(items, key) {
    return [...new Set(items.map((item) => item?.[key]).filter(Boolean))];
}
