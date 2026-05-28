export function mapReview(item = {}) {
    return {
        id: item.id,

        rating: Number(item.rating || 0),

        comment: item.comment || '',

        user: {
            id: item.user?.id,
            name: item.user?.name || '',
            avatar: item.user?.avatar || '',
        },

        product: {
            id: item.product?.id,
            name: item.product?.name || '',
            slug: item.product?.slug || '',
        },

        images: Array.isArray(item.images) ? item.images : [],

        createdAt: item.created_at || '',

        raw: item,
    };
}

export function mapReviewListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        reviews: raw.map(mapReview),

        averageRating: Number(response.average_rating || 0),

        totalReviews: Number(response.total_reviews || 0),

        ratingBreakdown: response.rating_breakdown || {},

        meta: {
            currentPage: Number(response.meta?.current_page || 1),
            lastPage: Number(response.meta?.last_page || 1),
            perPage: Number(response.meta?.per_page || 10),
            total: Number(response.meta?.total || 0),
        },

        raw: response,
    };
}
