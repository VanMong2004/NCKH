import api from './api';

const authService = {
    async login(payload) {
        const res = await api.post('auth/login', payload);
        return res.data; // { user, token }
    },

    async register(payload) {
        const res = await api.post('auth/register', payload);
        return res.data;
    },

    async logout() {
        return await api.post('/logout');
    },

    async me() {
        const res = await api.get('/user');
        return res.data;
    },
};

export default authService;
