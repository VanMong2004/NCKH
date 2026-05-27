function toNumber(value) {
    return Number(value || 0);
}

export function mapOrderTracking(item = {}) {
    return {
        id: item.id,
        orderCode: item.order_code,
        status: item.status,
        total: toNumber(item.total),
        updatedAt: item.updated_at,
        progress: Array.isArray(item.progress)
            ? item.progress.map((step) => ({
                  key: step.key,
                  label: step.label,
                  done: Boolean(step.done),
              }))
            : [],
        raw: item,
    };
}

export function mapMonthlyItem(item = {}) {
    return {
        month: item.month,
        total: toNumber(item.total),
        raw: item,
    };
}

export function mapStatusItem(item = {}) {
    return {
        status: item.status,
        total: toNumber(item.total),
        raw: item,
    };
}

export function mapRegisteredCampaignProduct(item = {}) {
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

export function mapCampaignHistory(item = {}) {
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

export function mapSpendingByCategory(item = {}) {
    return {
        categoryId: item.category_id,
        categoryName: item.category_name,
        total: toNumber(item.total),
        raw: item,
    };
}

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

export function mapPurchasedProduct(item = {}) {
    return {
        productId: item.product_id,
        name: item.name,
        slug: item.slug,
        totalQuantity: toNumber(item.total_quantity),
        raw: item,
    };
}

export function mapViewedProduct(item = {}) {
    return {
        productId: item.product_id,
        name: item.name,
        slug: item.slug,
        viewedAt: item.viewed_at,
        raw: item,
    };
}

export function mapReviewedProduct(item = {}) {
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

export function mapCampaignsAnalytics(data = {}) {
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
        lastUpdatedAt: data.last_updated_at,
        note: data.note,
        raw: data,
    };
}

export function mapUserAnalyticsOverviewResponse(response = {}) {
    const data = response.data || {};

    return {
        orders: mapOrdersAnalytics(data.orders || {}),
        campaigns: mapCampaignsAnalytics(data.campaigns || {}),
        spending: mapSpendingAnalytics(data.spending || {}),
        interests: mapInterestsAnalytics(data.interests || {}),
        tracking: mapTrackingAnalytics(data.tracking || {}),
        success: Boolean(response.success ?? true),
        message: response.message || '',
        raw: data,
    };
}

export function mapOrdersAnalyticsResponse(response = {}) {
    return mapOrdersAnalytics(response.data || {});
}

export function mapCampaignsAnalyticsResponse(response = {}) {
    return mapCampaignsAnalytics(response.data || {});
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
