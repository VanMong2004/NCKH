function toNumber(value) {
    return Number(value || 0);
}

/**
 * BE formatOrderTracking() trả:
 * id, order_code, status, total, updated_at, progress
 */
export function mapOrderTracking(item) {
    return {
        id: item.id,
        orderCode: item.order_code,
        status: item.status,
        total: toNumber(item.total),
        updatedAt: item.updated_at,
        progress: Array.isArray(item.progress) ? item.progress.map(mapOrderProgressStep) : [],
        raw: item,
    };
}

/**
 * BE orderProgress() trả:
 * key, label, done
 */
export function mapOrderProgressStep(step) {
    return {
        key: step.key,
        label: step.label,
        done: Boolean(step.done),
        raw: step,
    };
}

/**
 * BE monthly_orders / monthly_spending trả:
 * month, total
 */
export function mapMonthlyItem(item) {
    return {
        month: item.month,
        total: toNumber(item.total),
        raw: item,
    };
}

/**
 * BE status_breakdown trả:
 * status, total
 */
export function mapStatusItem(item) {
    return {
        status: item.status,
        total: toNumber(item.total),
        raw: item,
    };
}

/**
 * BE registered_products trả:
 * user_campaign_item_id, product_id, product_name, sku,
 * size, color, quantity, approved_quantity, paid_quantity, status
 */
export function mapRegisteredCampaignProduct(item) {
    return {
        userCampaignItemId: item.user_campaign_item_id,
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        size: item.size,
        color: item.color,
        quantity: toNumber(item.quantity),
        approvedQuantity: toNumber(item.approved_quantity),
        paidQuantity: toNumber(item.paid_quantity),
        status: item.status,
        raw: item,
    };
}

/**
 * BE campaigns.history trả:
 * id, campaign_id, title, slug, registration_status, created_at
 */
export function mapCampaignHistory(item) {
    return {
        id: item.id,
        campaignId: item.campaign_id,
        title: item.title,
        slug: item.slug,
        registrationStatus: item.registration_status,
        createdAt: item.created_at,
        raw: item,
    };
}

/**
 * BE spending_by_category trả:
 * category_id, category_name, total
 */
export function mapSpendingByCategory(item) {
    return {
        categoryId: item.category_id,
        categoryName: item.category_name,
        total: toNumber(item.total),
        raw: item,
    };
}

/**
 * BE highest_order trả:
 * id, order_code, status, total, created_at
 */
export function mapHighestOrder(item) {
    if (!item) return null;

    return {
        id: item.id,
        orderCode: item.order_code,
        status: item.status,
        total: toNumber(item.total),
        createdAt: item.created_at,
        raw: item,
    };
}

/**
 * BE most_purchased_products trả:
 * product_id, name, slug, total_quantity
 */
export function mapPurchasedProduct(item) {
    return {
        productId: item.product_id,
        name: item.name,
        slug: item.slug,
        totalQuantity: toNumber(item.total_quantity),
        raw: item,
    };
}

/**
 * BE most_viewed_products trả:
 * product_id, name, slug, viewed_at
 */
export function mapViewedProduct(item) {
    return {
        productId: item.product_id,
        name: item.name,
        slug: item.slug,
        viewedAt: item.viewed_at,
        raw: item,
    };
}

/**
 * BE reviewed_products trả:
 * review_id, product_id, product_name, rating, comment, created_at
 */
export function mapReviewedProduct(item) {
    return {
        reviewId: item.review_id,
        productId: item.product_id,
        productName: item.product_name,
        rating: toNumber(item.rating),
        comment: item.comment,
        createdAt: item.created_at,
        raw: item,
    };
}

/**
 * GET /api/user-analytics/orders
 */
export function mapOrdersAnalytics(data) {
    return {
        totalOrders: toNumber(data.total_orders),
        totalSpent: toNumber(data.total_spent),
        recentOrders: Array.isArray(data.recent_orders) ? data.recent_orders.map(mapOrderTracking) : [],
        monthlyOrders: Array.isArray(data.monthly_orders) ? data.monthly_orders.map(mapMonthlyItem) : [],
        statusBreakdown: Array.isArray(data.status_breakdown) ? data.status_breakdown.map(mapStatusItem) : [],
        raw: data,
    };
}

/**
 * GET /api/user-analytics/campaigns
 */
export function mapCampaignsAnalytics(data) {
    return {
        totalCampaigns: toNumber(data.total_campaigns),
        activeCampaigns: toNumber(data.active_campaigns),
        completedCampaigns: toNumber(data.completed_campaigns),
        registeredProducts: Array.isArray(data.registered_products)
            ? data.registered_products.map(mapRegisteredCampaignProduct)
            : [],
        history: Array.isArray(data.history) ? data.history.map(mapCampaignHistory) : [],
        raw: data,
    };
}

/**
 * GET /api/user-analytics/spending
 */
export function mapSpendingAnalytics(data) {
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

/**
 * GET /api/user-analytics/interests
 */
export function mapInterestsAnalytics(data) {
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

/**
 * GET /api/user-analytics/order-tracking
 */
export function mapTrackingAnalytics(data) {
    return {
        orders: Array.isArray(data.orders) ? data.orders.map(mapOrderTracking) : [],
        lastUpdatedAt: data.last_updated_at,
        note: data.note,
        raw: data,
    };
}

/**
 * GET /api/user-analytics/overview
 * BE trả data gồm:
 * orders, campaigns, spending, interests, tracking
 */
export function mapUserAnalyticsOverviewResponse(response) {
    const data = response.data || {};

    return {
        orders: mapOrdersAnalytics(data.orders || {}),
        campaigns: mapCampaignsAnalytics(data.campaigns || {}),
        spending: mapSpendingAnalytics(data.spending || {}),
        interests: mapInterestsAnalytics(data.interests || {}),
        tracking: mapTrackingAnalytics(data.tracking || {}),
        success: Boolean(response.success),
        message: response.message,
        raw: data,
    };
}

export function mapOrdersAnalyticsResponse(response) {
    return mapOrdersAnalytics(response.data || {});
}

export function mapCampaignsAnalyticsResponse(response) {
    return mapCampaignsAnalytics(response.data || {});
}

export function mapSpendingAnalyticsResponse(response) {
    return mapSpendingAnalytics(response.data || {});
}

export function mapInterestsAnalyticsResponse(response) {
    return mapInterestsAnalytics(response.data || {});
}

export function mapTrackingAnalyticsResponse(response) {
    return mapTrackingAnalytics(response.data || {});
}
