export function mapOrder(item = {}) {
    return {
        id: item.order_id || item.id,

        code: item.order_code || item.code,

        status: item.status || 'pending',

        createdAt: item.created_at,

        summary: {
            subTotal: Number(item.sub_total || 0),

            shippingFee: Number(item.shipping_fee || 0),

            discount: Number(item.discount || 0),

            grandTotal: Number(item.grand_total || item.total || 0),
        },

        payment: {
            method: item.payment_method,

            status: item.payment_status,

            statusText: mapPaymentStatus(item.payment_status),
        },

        items: (item.items || []).map(mapOrderItem),

        raw: item,
    };
}
