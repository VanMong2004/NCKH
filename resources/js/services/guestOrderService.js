import api from './api';
import guestTokenService from './guestTokenService';
import { mapGuestOrderLookupResponse } from './mappers/orderMapper';

const guestOrderService = {
    async lookup(payload) {
        const res = await api.post('/guest/orders/lookup', payload);

        return mapGuestOrderLookupResponse(res.data);
    },

    async cancelOrder(orderCode, payload, options = {}) {
        const headers = resolveGuestHeaders(options);

        const res = await api.post(
            `/guest/orders/${encodeURIComponent(orderCode)}/cancel`,
            payload,
            {
                headers,
            }
        );

        return mapGuestOrderLookupResponse(res.data);
    },

    async getVatInvoiceRequest(orderCode, options = {}) {
        const headers = resolveGuestHeaders(options);

        const res = await api.get(
            `/guest/orders/${encodeURIComponent(orderCode)}/vat-invoice-request`,
            {
                headers,
            }
        );

        return res.data?.data || null;
    },

    async createVatInvoiceRequest(orderCode, payload, options = {}) {
        const headers = resolveGuestHeaders(options);

        const res = await api.post(
            `/guest/orders/${encodeURIComponent(orderCode)}/vat-invoice-request`,
            payload,
            {
                headers,
            }
        );

        return res.data?.data || null;
    },
};

function resolveGuestHeaders(options = {}) {
    const guest = JSON.parse(
        sessionStorage.getItem('guest_order_success') || '{}'
    );

    const guestToken = options.guestToken || guest.guestToken || guestTokenService.peekToken() || '';
    const guestLookupToken = String(options.guestLookupToken || guest.guestLookupToken || '').trim().toUpperCase();
    const headers = {};

    if (guestToken) {
        headers['X-Guest-Token'] = guestToken;
    }

    if (guestLookupToken) {
        headers['X-Guest-Lookup-Token'] = guestLookupToken;
    }

    return headers;
}

export default guestOrderService;
