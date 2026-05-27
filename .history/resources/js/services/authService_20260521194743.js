import api from './api';

const authService = {
    async login(payload) {
        const res = await api.post('/auth/login', payload);
        return res.data;
    },

    async register(payload) {
        const res = await api.post('/auth/register', payload);
        return res.data;
    },

    async forgotPassword(payload) {
        const res = await api.post('/auth/forgot-password', payload);
        return res.data;
    },

    async resetPassword(payload) {
        const res = await api.post('/auth/reset-password', payload);
        return res.data;
    },

    async logout() {
        const res = await api.post('/logout');
        return res.data;
    },

    async me() {
        const res = await api.get('/me');
        return res.data;
    },

    async updateProfile(payload) {
        const res = await api.put('/auth/update', payload);

        return res.data;
    },
};

export default authService;
