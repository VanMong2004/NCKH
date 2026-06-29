function toNumber(value) {
    return Number(value || 0);
}

export function formatNumber(value) {
    return toNumber(value).toLocaleString('vi-VN');
}

export function formatMoney(value) {
    return toNumber(value).toLocaleString('vi-VN') + ' đ';
}

export function getDateLabel(value, short = false) {
    if (!value) return '—';

    const raw = String(value);

    if (!raw.includes('-')) return raw;

    const [year, month, day] = raw.split('-');

    if (!year || !month) return raw;

    if (short) {
        return day ? `${day}/${month}` : `${month}/${year}`;
    }

    return day ? `${day}/${month}/${year}` : `${month}/${year}`;
}

export function mapAdminAnalyticsOverviewResponse(response = {}) {
    const data = response.data || {};

    return {
        totalOrders: toNumber(data.total_orders),
        pendingOrders: toNumber(data.pending_orders),
        paidOrders: toNumber(data.paid_orders),
        cancelledOrders: toNumber(data.cancelled_orders),
        completedOrders: toNumber(data.completed_orders),

        revenue: toNumber(data.revenue),
        completedRevenue: toNumber(data.completed_revenue),

        totalUsers: toNumber(data.total_users),
        totalProducts: toNumber(data.total_products),
        activeProducts: toNumber(data.active_products),

        raw: response,
    };
}

export function mapAdminAnalyticsTopProductsResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        products: raw.map((item) => ({
            id: item.id,
            name: item.name || '',
            slug: item.slug || '',
            sold: toNumber(item.sold),
            revenue: toNumber(item.revenue),
            raw: item,
        })),
        raw: response,
    };
}

export function mapAdminAnalyticsSalesChartResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        chart: raw.map((item) => ({
            date: item.date || '',
            label: item.label || item.date || '',
            revenue: toNumber(item.revenue),
            ordersCount: toNumber(item.orders_count),
            raw: item,
        })),
        raw: response,
    };
}

export function mapAdminAnalyticsBehaviorChartResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        chart: raw.map((item) => ({
            date: item.date || '',
            label: item.label || item.date || '',
            visitors: toNumber(item.visitors),
            pageViews: toNumber(item.page_views),
            productViews: toNumber(item.product_views),
            raw: item,
        })),
        raw: response,
    };
}

export function mapAdminAnalyticsCategoryRevenueResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        categories: raw.map((item) => ({
            id: item.id,
            name: item.name || 'Chưa phân loại',
            revenue: toNumber(item.revenue),
            sold: toNumber(item.sold),
            raw: item,
        })),
        raw: response,
    };
}

export function mapAdminAnalyticsBehaviorOverviewResponse(response = {}) {
    const data = response.data || {};

    return {
        visitors: toNumber(data.visitors),
        sessions: toNumber(data.sessions),
        pageViews: toNumber(data.page_views),
        productViews: toNumber(data.product_views),
        addToCart: toNumber(data.add_to_cart),
        checkoutStarted: toNumber(data.checkout_started),
        purchases: toNumber(data.purchases),
        bounceSessions: toNumber(data.bounce_sessions),
        addToCartRate: toNumber(data.add_to_cart_rate),
        checkoutRate: toNumber(data.checkout_rate),
        purchaseRate: toNumber(data.purchase_rate),
        conversionRate: toNumber(data.conversion_rate),
        bounceRate: toNumber(data.bounce_rate),
        repeatPurchaseRate: toNumber(data.repeat_purchase_rate),
        raw: response,
    };
}
