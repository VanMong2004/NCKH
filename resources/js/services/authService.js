import api from './api';

import { mapAuthActionResponse, mapAuthResponse, mapMeResponse } from './mappers/authMapper';

const authService = {
    async login(payload) {
        const res = await api.post('/auth/login', payload);
        return mapAuthResponse(res.data);
    },

    async google(payload) {
        const res = await api.post('/auth/google', payload);
        return mapAuthResponse(res.data);
    },

    async register(payload) {
        const res = await api.post('/auth/register', payload);
        return mapAuthResponse(res.data);
    },

    async forgotPassword(payload) {
        const res = await api.post('/auth/forgot-password', payload);
        return mapAuthActionResponse(res.data);
    },

    async resetPassword(payload) {
        const res = await api.post('/auth/reset-password', payload);
        return mapAuthActionResponse(res.data);
    },

    async logout() {
        const res = await api.post('/logout');
        return mapAuthActionResponse(res.data);
    },

    async me() {
        const res = await api.get('/me');
        return mapMeResponse(res.data);
    },

    async updateProfile(payload) {
        const res = await api.post('/me', payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            transformRequest: [(data) => data],
        });

        return mapMeResponse(res.data);
    },
};

export default authService;
