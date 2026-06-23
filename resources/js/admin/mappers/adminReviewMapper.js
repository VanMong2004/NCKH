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

export function getReviewStatus(review = {}) {
    if (review.is_deleted || review.isDeleted) return 'deleted';
    if (review.is_active || review.isActive) return 'visible';

    return 'hidden';
}

export function getReviewStatusText(status) {
    const map = {
        visible: 'Đang hiển thị',
        hidden: 'Đã ẩn',
        deleted: 'Đã xóa',
        all: 'Tất cả',
    };

    return map[status] || 'Không rõ';
}

export function mapAdminReview(item = {}) {
    const product = item.product || null;
    const user = item.user || null;

    const review = {
        id: item.id,
        orderId: item.order_id || null,
        orderCode: item.order_code || '',

        rating: toNumber(item.rating),
        comment: item.comment || '',

        isActive: toBoolean(item.is_active),
        isDeleted: toBoolean(item.is_deleted),

        product: product
            ? {
                  id: product.id || null,
                  name: product.name || 'Sản phẩm',
                  slug: product.slug || '',
              }
            : null,

        user: user
            ? {
                  id: user.id || null,
                  name: user.name || 'Người dùng',
                  email: user.email || '',
                  avatar: normalizeImage(user.avatar),
              }
            : null,

        images: Array.isArray(item.images) ? item.images.map(normalizeImage) : [],

        createdAt: item.created_at || '',
        deletedAt: item.deleted_at || '',

        raw: item,
    };

    const status = getReviewStatus(review);

    return {
        ...review,
        status,
        statusText: getReviewStatusText(status),
    };
}

export function mapAdminReviewListResponse(response = {}) {
    const paginator = response.data || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        reviews: raw.map(mapAdminReview),
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 10),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminReviewDetailResponse(response = {}) {
    return mapAdminReview(response.data || {});
}

export function mapAdminReviewStatisticsResponse(response = {}) {
    const data = response.data || {};

    return {
        totalReviews: toNumber(data.total_reviews),
        visibleReviews: toNumber(data.visible_reviews),
        hiddenReviews: toNumber(data.hidden_reviews),
        deletedReviews: toNumber(data.deleted_reviews),
        averageRating: toNumber(data.average_rating),
        lowRatingReviews: toNumber(data.low_rating_reviews),

        ratingBreakdown: {
            5: toNumber(data.rating_breakdown?.[5]),
            4: toNumber(data.rating_breakdown?.[4]),
            3: toNumber(data.rating_breakdown?.[3]),
            2: toNumber(data.rating_breakdown?.[2]),
            1: toNumber(data.rating_breakdown?.[1]),
        },

        topReviewedProducts: Array.isArray(data.top_reviewed_products)
            ? data.top_reviewed_products.map((item) => ({
                  id: item.id,
                  name: item.name || '',
                  slug: item.slug || '',
                  reviewsCount: toNumber(item.reviews_count),
                  averageRating: toNumber(item.average_rating),
              }))
            : [],

        lowestRatedProducts: Array.isArray(data.lowest_rated_products)
            ? data.lowest_rated_products.map((item) => ({
                  id: item.id,
                  name: item.name || '',
                  slug: item.slug || '',
                  reviewsCount: toNumber(item.reviews_count),
                  averageRating: toNumber(item.average_rating),
              }))
            : [],

        raw: response,
    };
}
