export function mapAnalyticsOverview(data = {}) {
    return {
        totalOrders: Number(data.total_orders || 0),
        paidOrders: Number(data.paid_orders || 0),
        revenue: Number(data.revenue || 0),
        totalUsers: Number(data.total_users || 0),
    };
}

export function mapTopProduct(item = {}) {
    return {
        id: item.product_id,
        name: item.name || 'Sản phẩm',
        slug: item.slug || '',
        sold: Number(item.sold || 0),
        revenue: Number(item.revenue || 0),
    };
}

export function mapSalesChartItem(item = {}) {
    return {
        date: item.date || '',
        revenue: Number(item.revenue || 0),
    };
}
