export function mapCheckoutOrderResponse(response = {}) {
    const item = response.data;

    return {
        id: item.order_id,

        orderId: item.order_id,

        userId: item.user_id,

        code: item.order_code,

        orderCode: item.order_code,

        status: item.status,

        subTotal: Number(item.sub_total || 0),

        shippingFee: Number(item.shipping_fee || 0),

        discount: Number(item.discount || 0),

        grandTotal: Number(item.grand_total || 0),

        paymentMethod: item.payment_method,

        items: Array.isArray(item.items) ? item.items.map(mapCheckoutOrderItem) : [],

        raw: item,
    };
}

function mapCheckoutOrderItem(item = {}) {
    return {
        productName: item.product_name,

        price: Number(item.price || 0),

        quantity: Number(item.quantity || 0),

        total: Number(item.total || 0),

        raw: item,
    };
}
