import api from '../../services/api';

import {
    mapAdminAnalyticsOverviewResponse,
    mapAdminAnalyticsSalesChartResponse,
    mapAdminAnalyticsTopProductsResponse,
} from '../mappers/adminAnalyticMapper';

const adminAnalyticsService = {
    async getOverview() {
        const res = await api.get('/admin/analytics/overview');
        return mapAdminAnalyticsOverviewResponse(res.data);
    },

    async getTopProducts() {
        const res = await api.get('/admin/analytics/top-products');
        return mapAdminAnalyticsTopProductsResponse(res.data);
    },

    async getSalesChart(days = 30) {
        const res = await api.get('/admin/analytics/sales-chart', {
            params: {
                days,
            },
        });

        return mapAdminAnalyticsSalesChartResponse(res.data);
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
