import api from '../../services/api';

import {
    mapAdminAnalyticsOverviewResponse,
    mapAdminAnalyticsBehaviorOverviewResponse,
    mapAdminAnalyticsBehaviorChartResponse,
    mapAdminAnalyticsCategoryRevenueResponse,
    mapAdminAnalyticsSalesChartResponse,
    mapAdminAnalyticsTopProductsResponse,
} from '../mappers/adminAnalyticMapper';

const adminAnalyticsService = {
    async getOverview() {
        const res = await api.get('/admin/analytics/overview');
        return mapAdminAnalyticsOverviewResponse(res.data);
    },

    async getTopProducts(params = {}) {
        const res = await api.get('/admin/analytics/top-products', { params });
        return mapAdminAnalyticsTopProductsResponse(res.data);
    },

    async getSalesChart(days = 30, params = {}) {
        const res = await api.get('/admin/analytics/sales-chart', {
            params: {
                days,
                ...params,
            },
        });

        return mapAdminAnalyticsSalesChartResponse(res.data);
    },

    async getBehaviorOverview(days = 30, params = {}) {
        const res = await api.get('/admin/analytics/behavior-overview', {
            params: {
                days,
                ...params,
            },
        });

        return mapAdminAnalyticsBehaviorOverviewResponse(res.data);
    },

    async getBehaviorChart(days = 30, params = {}) {
        const res = await api.get('/admin/analytics/behavior-chart', {
            params: {
                days,
                ...params,
            },
        });

        return mapAdminAnalyticsBehaviorChartResponse(res.data);
    },

    async getRevenueByCategory(limit = 8, params = {}) {
        const res = await api.get('/admin/analytics/revenue-by-category', {
            params: {
                limit,
                ...params,
            },
        });

        return mapAdminAnalyticsCategoryRevenueResponse(res.data);
    },

    async exportPdf() {
        const res = await api.get('/admin/analytics/export/pdf', {
            responseType: 'blob',
        });

        downloadBlob(res.data, 'admin-analytics-report.pdf');
    },

    async exportExcel() {
        const res = await api.get('/admin/analytics/export/excel', {
            responseType: 'blob',
        });

        downloadBlob(res.data, 'admin-analytics.xlsx');
    },
};

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
}

export default adminAnalyticsService;
