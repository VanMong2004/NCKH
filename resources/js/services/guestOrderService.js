import api from './api';
import { mapOrderDetailResponse } from './mappers/orderMapper';

const guestOrderService = {
    async lookup(payload) {
        const res = await api.post('/guest/orders/lookup', payload);

        return mapOrderDetailResponse(res.data);
    },
};

export default guestOrderService;