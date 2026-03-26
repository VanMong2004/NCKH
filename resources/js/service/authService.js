import apiClient from './apiClient';

const authService = {
    async login(payload) {
        // Khi chưa có backend thật, bạn có thể tạm mock ở đây
        // Sau này chỉ cần bỏ phần mock và mở phần apiClient.post là xong

        // MOCK DEMO
        await new Promise((resolve) => setTimeout(resolve, 500));

        return {
            user: {
                id: 1,
                name: 'Nguyễn Văn A',
                email: payload.email,
                avatar: 'https://i.pravatar.cc/100?img=12',
                role: 'user'
            },
            token: 'fake-jwt-token',
        };

        // BACKEND THẬT (mở lại sau)
        // const res = await apiClient.post('/login', payload);
        // return res.data;
    },

    async register(payload) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        return {
            user: {
                id: 2,
                name: payload.name || 'Người dùng mới',
                email: payload.email,
                avatar: 'https://i.pravatar.cc/100?img=15',
            },
            token: 'fake-jwt-token',
        };

        // const res = await apiClient.post('/register', payload);
        // return res.data;
    },

    async logout() {
        // Nếu chưa có backend, có thể chỉ return true
        return true;

        // const res = await apiClient.post('/logout');
        // return res.data;
    },

    async me() {
        // Sau này dùng để lấy thông tin user hiện tại từ token
        const res = await apiClient.get('/me');
        return res.data;
    },
};

export default authService;