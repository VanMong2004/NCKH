function toNumber(value) {
    return Number(value || 0);
}

export function mapOrderProgressStep(step = {}) {
    return {
        key: step.key || '',
        label: step.label || '',
        done: Boolean(step.done),
        raw: step,
    };
}

export function mapOrderTracking(item = {}) {
    return {
        id: item.id,
        orderCode: item.order_code || '',
        status: item.status || '',
        statusText: orderStatusText(item.status),
        total: toNumber(item.total),
        updatedAt: item.updated_at || '',
        progress: Array.isArray(item.progress) ? item.progress.map(mapOrderProgressStep) : [],
        raw: item,
    };
}

export function mapMonthlyItem(item = {}) {
    return {
        month: item.month || '',
        total: toNumber(item.total),
        raw: item,
    };
}

export function mapStatusItem(item = {}) {
    return {
        status: item.status || '',
        statusText: orderStatusText(item.status),
        total: toNumber(item.total),
        raw: item,
    };
}

export function mapSpendingByCategory(item = {}) {
    return {
        categoryId: item.category_id,
        categoryName: item.category_name || '',
        total: toNumber(item.total),
        raw: item,
    };
}

export function mapHighestOrder(item = null) {
    if (!item) return null;

    return {
        id: item.id,
        orderCode: item.order_code || '',
        status: item.status || '',
        statusText: orderStatusText(item.status),
        total: toNumber(item.total),
        createdAt: item.created_at || '',
        raw: item,
    };
}

export function mapPurchasedProduct(item = {}) {
    return {
        productId: item.product_id,
        id: item.product_id,
        name: item.name || '',
        slug: item.slug || '',
        totalQuantity: toNumber(item.total_quantity),
        raw: item,
    };
}

export function mapViewedProduct(item = {}) {
    return {
        productId: item.product_id,
        id: item.product_id,
        name: item.name || '',
        slug: item.slug || '',
        viewedAt: item.viewed_at || '',
        raw: item,
    };
}

export function mapReviewedProduct(item = {}) {
    return {
        reviewId: item.review_id,
        productId: item.product_id,
        productName: item.product_name || '',
        rating: toNumber(item.rating),
        comment: item.comment || '',
        createdAt: item.created_at || '',
        raw: item,
    };
}

export function mapOrdersAnalytics(data = {}) {
    return {
        totalOrders: toNumber(data.total_orders),
        totalSpent: toNumber(data.total_spent),
        recentOrders: Array.isArray(data.recent_orders) ? data.recent_orders.map(mapOrderTracking) : [],
        monthlyOrders: Array.isArray(data.monthly_orders) ? data.monthly_orders.map(mapMonthlyItem) : [],
        statusBreakdown: Array.isArray(data.status_breakdown) ? data.status_breakdown.map(mapStatusItem) : [],
        raw: data,
    };
}

export function mapSpendingAnalytics(data = {}) {
    return {
        totalSpent: toNumber(data.total_spent),
        monthlySpending: Array.isArray(data.monthly_spending) ? data.monthly_spending.map(mapMonthlyItem) : [],
        spendingByCategory: Array.isArray(data.spending_by_category)
            ? data.spending_by_category.map(mapSpendingByCategory)
            : [],
        highestOrder: mapHighestOrder(data.highest_order),
        raw: data,
    };
}

export function mapInterestsAnalytics(data = {}) {
    return {
        mostPurchasedProducts: Array.isArray(data.most_purchased_products)
            ? data.most_purchased_products.map(mapPurchasedProduct)
            : [],
        mostViewedProducts: Array.isArray(data.most_viewed_products)
            ? data.most_viewed_products.map(mapViewedProduct)
            : [],
        reviewedProducts: Array.isArray(data.reviewed_products) ? data.reviewed_products.map(mapReviewedProduct) : [],
        raw: data,
    };
}

export function mapTrackingAnalytics(data = {}) {
    return {
        orders: Array.isArray(data.orders) ? data.orders.map(mapOrderTracking) : [],
        lastUpdatedAt: data.last_updated_at || '',
        note: data.note || '',
        raw: data,
    };
}

export function mapUserAnalyticsOverviewResponse(response = {}) {
    const data = response.data || {};

    const orders = mapOrdersAnalytics(data.orders || {});
    const spending = mapSpendingAnalytics(data.spending || {});
    const interests = mapInterestsAnalytics(data.interests || {});
    const tracking = mapTrackingAnalytics(data.tracking || {});

    return {
        orders,
        spending,
        interests,
        tracking,

        summary: {
            totalOrders: orders.totalOrders,
            totalSpent: spending.totalSpent,
        },

        success: Boolean(response.success),
        message: response.message || '',
        raw: data,
    };
}

export function mapOrdersAnalyticsResponse(response = {}) {
    return mapOrdersAnalytics(response.data || {});
}

export function mapSpendingAnalyticsResponse(response = {}) {
    return mapSpendingAnalytics(response.data || {});
}

export function mapInterestsAnalyticsResponse(response = {}) {
    return mapInterestsAnalytics(response.data || {});
}

export function mapTrackingAnalyticsResponse(response = {}) {
    return mapTrackingAnalytics(response.data || {});
}

export function orderStatusText(status) {
    const map = {
        pending: 'Đã tạo đơn',
        paid: 'Đã thanh toán',
        processing: 'Đang xử lý',
        ready_to_pickup: 'Sẵn sàng nhận hàng',
        delivered: 'Đã giao',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Đang cập nhật';
}
