import { mapPayment } from './paymentMapper';

function toNumber(value) {
    return Number(value || 0);
}

function mapReceiver(receiver = {}) {
    return {
        name: receiver.name || '',
        phone: receiver.phone || '',
        address: receiver.address || '',
        raw: receiver,
    };
}

function mapSummary(summary = {}) {
    return {
        subTotal: toNumber(summary.sub_total),
        shippingFee: toNumber(summary.shipping_fee),
        discount: toNumber(summary.discount),
        grandTotal: toNumber(summary.grand_total),
        raw: summary,
    };
}

function mapOrderItem(item = {}) {
    return {
        id: item.id,
        productName: item.product_name || '',
        thumbnail: item.thumbnail || '',
        variant: item.variant || {
            size: '',
            color: '',
        },
        price: toNumber(item.price),
        quantity: toNumber(item.quantity),
        total: toNumber(item.total),
        raw: item,
    };
}

function mapTimelineItem(item = {}) {
    return {
        label: item.label || '',
        done: Boolean(item.status),
        time: item.time || '',
        raw: item,
    };
}

function mapPickup(pickup = {}) {
    return {
        location: pickup.location || '',
        instruction: pickup.instruction || '',
        raw: pickup,
    };
}

function mapCheckoutOrderItem(item = {}) {
    return {
        productName: item.product_name || '',
        price: toNumber(item.price),
        quantity: toNumber(item.quantity),
        total: toNumber(item.total),
        raw: item,
    };
}

/**
 * POST /api/orders/checkout
 *
 * BE trả:
 * data.user_id
 * data.order_id
 * data.order_code
 * data.status
 * data.sub_total
 * data.shipping_fee
 * data.discount
 * data.grand_total
 * data.payment_method
 * data.items
 */
export function mapCheckoutOrderResponse(response = {}) {
    const item = response.data || {};

    return {
        id: item.order_id,
        orderId: item.order_id,
        userId: item.user_id,

        code: item.order_code || '',
        orderCode: item.order_code || '',

        status: item.status || '',
        statusText: orderStatusText(item.status),

        subTotal: Number(item.sub_total || 0),
        shippingFee: Number(item.shipping_fee || 0),
        discount: Number(item.discount || 0),
        grandTotal: Number(item.grand_total || 0),

        paymentMethod: item.payment_method || '',

        items: Array.isArray(item.items)
            ? item.items.map((orderItem) => ({
                  productName: orderItem.product_name || '',
                  price: Number(orderItem.price || 0),
                  quantity: Number(orderItem.quantity || 0),
                  total: Number(orderItem.total || 0),
                  raw: orderItem,
              }))
            : [],

        raw: item,
    };
}
/**
 * GET /api/orders
 */
export function mapOrderListItem(item = {}) {
    return {
        id: item.id,

        code: item.order_code,
        orderCode: item.order_code,

        title: item.title || '',

        type: item.type,
        status: item.status,
        statusText: orderStatusText(item.status),

        payment: mapPayment({
            id: null,
            method: item.payment_method,
            status: item.payment_status,
            amount: item.total,
            transaction_id: null,
            payment_url: null,
            qr_code: null,
            created_at: '',
        }),

        thumbnail: item.thumbnail || '',

        itemCount: toNumber(item.item_count),
        total: toNumber(item.total),

        qrCode: item.qr_code,
        createdAt: item.created_at,
        detailUrl: item.detail_url,

        raw: item,
    };
}

/**
 * GET /api/orders/{id}
 */
export function mapOrderDetailItem(item = {}) {
    return {
        id: item.id,

        code: item.order_code,
        orderCode: item.order_code,

        type: item.type,
        status: item.status,
        statusText: orderStatusText(item.status),

        qrCode: item.qr_code,

        receiver: mapReceiver(item.receiver),

        payment: item.payment ? mapPayment(item.payment) : null,

        summary: mapSummary(item.summary),

        items: Array.isArray(item.items) ? item.items.map(mapOrderItem) : [],

        pickup: mapPickup(item.pickup),

        timeline: Array.isArray(item.timeline) ? item.timeline.map(mapTimelineItem) : [],

        raw: item,
    };
}

export function mapOrderListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        orders: raw.map(mapOrderListItem),
        meta: {
            currentPage: toNumber(response.meta?.current_page),
            lastPage: toNumber(response.meta?.last_page),
            perPage: toNumber(response.meta?.per_page),
            total: toNumber(response.meta?.total),
        },
        raw: response,
    };
}

export function mapOrderDetailResponse(response = {}) {
    return mapOrderDetailItem(response.data || {});
}

export function orderStatusText(status) {
    const map = {
        pending: 'Chờ xử lý',
        paid: 'Đã thanh toán',
        confirmed: 'Đã xác nhận',
        processing: 'Đang chuẩn bị',
        shipping: 'Đang giao',
        ready_to_pickup: 'Sẵn sàng nhận hàng',
        delivered: 'Đã giao hàng',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Đang cập nhật';
}
