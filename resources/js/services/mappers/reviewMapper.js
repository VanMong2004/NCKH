export function mapReview(item = {}) {
    const rawImages = Array.isArray(item.images) ? item.images : [];

    return {
        id: item.id,

        orderId: item.order_id,

        rating: Number(item.rating || 0),

        comment: item.comment || '',

        user: {
            id: item.user?.id,
            name: item.user?.name || '',
            avatar: item.user?.avatar || item.user?.avatar_url || '',
        },

        product: {
            id: item.product?.id,
            name: item.product?.name || '',
            slug: item.product?.slug || '',
        },

        images: rawImages
            .map((image) => {
                if (typeof image === 'string') {
                    return normalizeReviewImage(image);
                }

                return normalizeReviewImage(image.image_url || image.url || '');
            })
            .filter(Boolean),

        createdAt: item.created_at || '',

        raw: item,
    };
}

export function mapReviewListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',

        reviews: raw.map(mapReview),

        averageRating: Number(response.average_rating || 0),

        totalReviews: Number(response.total_reviews || 0),

        ratingBreakdown: response.rating_breakdown || {},

        meta: {
            currentPage: Number(response.meta?.current_page || 1),
            lastPage: Number(response.meta?.last_page || 1),
            perPage: Number(response.meta?.per_page || 10),
            total: Number(response.meta?.total || raw.length),
        },

        raw: response,
    };
}

function normalizeReviewImage(url) {
    const value = String(url || '').trim();

    if (!value) return '';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}