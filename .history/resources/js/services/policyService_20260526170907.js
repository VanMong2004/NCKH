import api from './api';

import { mapPolicyDetailResponse, mapPolicyListResponse } from './mappers/policyMapper';

const policyService = {
    async getPolicies(params = {}) {
        const res = await api.get('/policies', { params });
        return mapPolicyListResponse(res.data);
    },

    async getPolicyDetail(slug) {
        const res = await api.get(`/policies/${slug}`);
        return mapPolicyDetailResponse(res.data);
    },
};

export default policyService;
