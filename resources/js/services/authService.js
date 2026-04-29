import api from './api';

const authService = {
    async login(payload) {
        const res = await api.post('/login', payload);
        return res.data; // { user, token }
    },

    async register(payload) {
        const res = await api.post('/register', payload);
        return res.data;
    },

    async logout() {
        return await api.post('/logout');
    },
};

export default authService;
