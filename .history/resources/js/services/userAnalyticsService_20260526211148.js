import api from './api';

import {
    mapCampaignsAnalyticsResponse,
    mapInterestsAnalyticsResponse,
    mapOrdersAnalyticsResponse,
    mapSpendingAnalyticsResponse,
    mapTrackingAnalyticsResponse,
    mapUserAnalyticsOverviewResponse,
} from './mappers/userAnalyticsMapper';

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

const userAnalyticsService = {
    async overview() {
        const res = await api.get('/user-analytics/overview');
        return mapUserAnalyticsOverviewResponse(res.data);
    },

    async orders(months = 12) {
        const res = await api.get('/user-analytics/orders', {
            params: {
                months,
            },
        });

        return mapOrdersAnalyticsResponse(res.data);
    },

    async campaigns() {
        const res = await api.get('/user-analytics/campaigns');
        return mapCampaignsAnalyticsResponse(res.data);
    },

    async spending(months = 12) {
        const res = await api.get('/user-analytics/spending', {
            params: {
                months,
            },
        });

        return mapSpendingAnalyticsResponse(res.data);
    },

    async interests() {
        const res = await api.get('/user-analytics/interests');
        return mapInterestsAnalyticsResponse(res.data);
    },

    async tracking() {
        const res = await api.get('/user-analytics/order-tracking');
        return mapTrackingAnalyticsResponse(res.data);
    },

    async exportPdf() {
        const res = await api.get('/user-analytics/export/pdf', {
            responseType: 'blob',
        });

        downloadBlob(res.data, 'user-analytics-report.pdf');
    },

    async exportExcel() {
        const res = await api.get('/user-analytics/export/excel', {
            responseType: 'blob',
        });

        downloadBlob(res.data, 'user-analytics.xlsx');
    },
};

export default userAnalyticsService;
