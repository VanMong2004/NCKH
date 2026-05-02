import api from './api';

const revenueService = {
    // 🔥 OVERVIEW
    async getOverview() {
        const res = await api.get('/admin/revenue/overview');
        return res.data;
    },

    // 📊 CHART
    async getChart(params = {}) {
        const res = await api.get('/admin/revenue/chart', { params });
        return res.data;
    },

    // 🏆 TOP PRODUCTS
    async getTopProducts(params = {}) {
        const res = await api.get('/admin/revenue/top-products', { params });
        return res.data;
    },

    // 👤 USER ANALYTICS
    async getUserAnalytics(params = {}) {
        const res = await api.get('/analytics', { params });
        return res.data;
    },
};

export default revenueService;
