import api from './api';

import {
    mapCampaignActionResponse,
    mapCampaignDetailResponse,
    mapCampaignItem,
    mapCampaignListResponse,
    mapMyCampaignDetailResponse,
    mapMyCampaignListResponse,
} from './mappers/campaignMapper';

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

        const raw = Array.isArray(res.data.data) ? res.data.data : [];

        return raw.map(mapCampaignItem);
    },

    async register(campaignId, payload) {
        const res = await api.post(`/campaigns/${campaignId}/register`, payload);
        return mapCampaignActionResponse(res.data);
    },

    async checkout(payload) {
        const res = await api.post('/campaigns/checkout', payload);
        return mapCampaignActionResponse(res.data);
    },

    async getMyCampaigns(params = {}) {
        const res = await api.get('/my-campaigns', {
            params,
        });

        return mapMyCampaignListResponse(res.data).campaigns;
    },

    async getMyCampaignDetail(id) {
        const res = await api.get(`/my-campaigns/${id}`);

        return mapMyCampaignDetailResponse(res.data);
    },
};

export default campaignService;
