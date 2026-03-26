const ORDER_STORAGE_KEY = 'orders_history';

const orderService = {
    async getOrders() {
        const raw = localStorage.getItem(ORDER_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    async saveOrders(orders) {
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
        return orders;
    },

    async createOrder(orderData) {
        const existingOrders = await this.getOrders();

        const newOrder = {
            id: `CTUT-${Date.now()}`,
            placedDate: new Date().toLocaleDateString('vi-VN'),

            status: 'processing',
            statusLabel: 'Đang xử lý',
            statusMessage: 'Đơn hàng của bạn đang được chuẩn bị.',
            ...orderData
        };

        const updatedOrders = [newOrder, ...existingOrders];
        await this.saveOrders(updatedOrders);

        return newOrder;
    },

    async getOrderById(orderId) {
        const orders = await this.getOrders();
        return orders.find((order) => order.id === orderId) || null;
    },

    async clearOrders() {
        localStorage.removeItem(ORDER_STORAGE_KEY);
        return [];
    },
};

export default orderService;
