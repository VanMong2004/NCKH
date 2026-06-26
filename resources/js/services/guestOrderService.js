import api from './api';
import { mapOrderDetailResponse } from './mappers/orderMapper';

const guestOrderService = {
    async lookup(payload) {
        const res = await api.post('/guest/orders/lookup', payload);

        return mapOrderDetailResponse(res.data);
    },

    async getByCode(orderCode) {
        const guest = JSON.parse(
            sessionStorage.getItem('guest_order_success') || '{}'
        );

        const res = await api.get(
            `/guest/orders/${encodeURIComponent(orderCode)}`,
            {
                headers: guest.guestToken
                    ? {
                          'X-Guest-Token': guest.guestToken,
                      }
                    : {},
            }
        );

        return mapOrderDetailResponse(res.data);
    },
};

export default guestOrderService;