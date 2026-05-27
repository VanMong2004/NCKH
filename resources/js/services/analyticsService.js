import api from './api';

import { mapAnalyticsOverview, mapSalesChartItem, mapTopProduct } from './mappers/analyticsMapper';

const analyticsService = {
    async overview() {
        const res = await api.get('/analytics/overview');
        return mapAnalyticsOverview(res.data?.data || {});
    },

    async topProducts() {
        const res = await api.get('/analytics/top-products');
        const raw = res.data?.data || [];

        return Array.isArray(raw) ? raw.map(mapTopProduct) : [];
    },

    async salesChart(days = 7) {
        const res = await api.get('/analytics/sales-chart', {
            params: { days },
        });

        const raw = res.data?.data || [];

        return Array.isArray(raw) ? raw.map(mapSalesChartItem) : [];
    },

    exportPdfUrl() {
        return '/api/analytics/export/pdf';
    },

    exportExcelUrl() {
        return '/api/analytics/export/excel';
    },
};

export default analyticsService;
