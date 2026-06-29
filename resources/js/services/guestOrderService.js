import api from './api';
import { mapOrderDetailResponse } from './mappers/orderMapper';

const guestOrderService = {
    async lookup(payload) {
        const res = await api.post('/guest/orders/lookup', payload);

        return mapOrderDetailResponse(res.data);
    },

    async getByCode(orderCode, options = {}) {
        const guest = JSON.parse(
            sessionStorage.getItem('guest_order_success') || '{}'
        );

        const guestToken = options.guestToken || guest.guestToken;

        const res = await api.get(
            `/guest/orders/${encodeURIComponent(orderCode)}`,
            {
                headers: guestToken
                    ? {
                          'X-Guest-Token': guestToken,
                      }
                    : {},
            }
        );

        return mapOrderDetailResponse(res.data);
    },
};

export default guestOrderService;
