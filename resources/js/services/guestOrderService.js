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

    async downloadBill(orderCode, options = {}) {
        const guest = JSON.parse(
            sessionStorage.getItem('guest_order_success') || '{}'
        );

        const guestToken = options.guestToken || guest.guestToken;

        const res = await api.get(
            `/guest/orders/${encodeURIComponent(orderCode)}/bill`,
            {
                responseType: 'blob',
                headers: guestToken
                    ? {
                          'X-Guest-Token': guestToken,
                      }
                    : {},
            }
        );

        downloadBlob(res.data, `bill-${orderCode}.pdf`);
    },

    async getVatInvoiceRequest(orderCode, options = {}) {
        const guest = JSON.parse(
            sessionStorage.getItem('guest_order_success') || '{}'
        );

        const guestToken = options.guestToken || guest.guestToken;

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
        const guest = JSON.parse(
            sessionStorage.getItem('guest_order_success') || '{}'
        );

        const guestToken = options.guestToken || guest.guestToken;

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

    async downloadVatInvoice(orderCode, options = {}) {
        const guest = JSON.parse(
            sessionStorage.getItem('guest_order_success') || '{}'
        );

        const guestToken = options.guestToken || guest.guestToken;

        const res = await api.get(
            `/guest/orders/${encodeURIComponent(orderCode)}/vat-invoice`,
            {
                responseType: 'blob',
                headers: guestToken
                    ? {
                          'X-Guest-Token': guestToken,
                      }
                    : {},
            }
        );

        downloadBlob(res.data, `vat-invoice-${orderCode}.pdf`);
    },
};

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
}

export default guestOrderService;
