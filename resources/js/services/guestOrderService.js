import api from './api';
import guestTokenService from './guestTokenService';
import { mapGuestOrderLookupResponse } from './mappers/orderMapper';

const guestOrderService = {
    async lookup(payload) {
        const res = await api.post('/guest/orders/lookup', payload);

        return mapGuestOrderLookupResponse(res.data);
    },

    async getVatInvoiceRequest(orderCode, options = {}) {
        const guestToken = resolveGuestToken(options);

        const res = await api.get(
            `/guest/orders/${encodeURIComponent(orderCode)}/vat-invoice-request`,
            {
                headers: guestToken
                    ? {
                          'X-Guest-Token': guestToken,
                      }
                    : {},
            }
        );

        return res.data?.data || null;
    },

    async createVatInvoiceRequest(orderCode, payload, options = {}) {
        const guestToken = resolveGuestToken(options);

        const res = await api.post(
            `/guest/orders/${encodeURIComponent(orderCode)}/vat-invoice-request`,
            payload,
            {
                headers: guestToken
                    ? {
                          'X-Guest-Token': guestToken,
                      }
                    : {},
            }
        );

        return res.data?.data || null;
    },
};

function resolveGuestToken(options = {}) {
    const guest = JSON.parse(
        sessionStorage.getItem('guest_order_success') || '{}'
    );

    return options.guestToken || guest.guestToken || guestTokenService.peekToken() || '';
}

export default guestOrderService;
