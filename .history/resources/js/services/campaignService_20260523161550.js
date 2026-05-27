import api from './api';

import { mapCampaignDetailResponse, mapCampaignListResponse } from './mappers/campaignMapper';

const campaignService = {
    async getCampaigns(params = {}) {
        const res = await api.get('/campaigns', {
            params,
        });

        return mapCampaignListResponse(res.data);
    },

    async getCampaignDetail(identifier) {
        const res = await api.get(`/campaigns/${identifier}`);
        return mapCampaignDetailResponse(res.data);
    },

    async getCampaignItems(id) {
        const res = await api.get(`/campaigns/${id}/items`);
        return res.data?.data || [];
    },

    async register(campaignId, payload) {
        const res = await api.post(`/campaigns/${campaignId}/register`, payload);
        return res.data;
    },

    async checkout(payload) {
        const res = await api.post('/campaigns/checkout', payload);
        return res.data?.data || res.data;
    },
};

export default campaignService;
