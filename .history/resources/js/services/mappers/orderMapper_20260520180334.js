import { mapPayment, paymentMethodText, paymentStatusText } from './paymentMapper';

export function mapOrder(item = {}) {
    const summary = item.summary || {};

    const paymentRaw = item.payment || {
        method: item.payment_method,
        status: item.payment_status,
        amount: summary.grand_total || item.grand_total || item.total,
    };

    const payment = mapPayment(paymentRaw);

    return {
        id: item.id || item.order_id,
        code: item.order_code || item.code || `#${item.id}`,

        status: item.status || 'pending',
        statusText: orderStatusText(item.status),

        createdAt: item.created_at || item.order_date || item.timeline?.[0]?.time || '',

        receiver: mapReceiver(item.receiver || item.address || item),

        payment: {
            ...payment,
            methodText: payment.methodText || paymentMethodText(payment.method),
            statusText: payment.statusText || paymentStatusText(payment.status),
        },

        summary: {
            subTotal: Number(summary.sub_total || item.sub_total || 0),
            shippingFee: Number(summary.shipping_fee || item.shipping_fee || 0),
            discount: Number(summary.discount || item.discount || 0),
            grandTotal: Number(summary.grand_total || item.grand_total || item.total_amount || item.total || 0),
        },

        items: mapOrderItems(item.items || item.order_items || []),
        itemCount: Number(item.item_count || item.items_count || item.items?.length || item.order_items?.length || 0),

        pickup: {
            location: item.pickup?.location || '',
            instruction: item.pickup?.instruction || '',
        },

        timeline: mapTimeline(item.timeline || [], item.status),

        raw: item,
    };
}

export function mapOrderDetailResponse(response = {}) {
    return mapOrder(response.data || response.order || response);
}

export function mapOrderListResponse(response = {}) {
    const raw = response.data?.data || response.orders?.data || response.data || response.orders || [];

    const meta = {
        currentPage: Number(response.meta?.current_page || response.current_page || 1),
        lastPage: Number(response.meta?.last_page || response.last_page || 1),
        total: Number(response.meta?.total || response.total || raw.length || 0),
    };

    return {
        orders: Array.isArray(raw) ? raw.map(mapOrder) : [],
        meta,
    };
}

function mapReceiver(receiver = {}) {
    return {
        name: receiver.name || receiver.full_name || receiver.receiver_name || '',
        phone: receiver.phone || '',
        email: receiver.email || '',
        address: receiver.address || receiver.full_address || receiver.address_line || '',
    };
}

function mapOrderItems(items = []) {
    return items.map((item) => ({
        id: item.id || item.order_id,
        productId: item.product_id,
        variantId: item.product_variant_id,
        productName: item.product_name || item.name || item.product?.name || '',
        slug: item.slug || item.product?.slug || '',
        thumbnail: item.thumbnail || item.image || item.product?.thumbnail || '/images/no-image.png',

        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        total: Number(item.total || item.price * item.quantity || 0),

        variant: {
            size: item.variant?.size || item.size || '',
            color: item.variant?.color || item.color || '',
        },

        raw: item,
    }));
}

function mapTimeline(timeline = [], status = 'pending') {
    if (timeline.length > 0) {
        return timeline.map((item) => ({
            label: item.label,
            time: item.time,
            done: Boolean(item.status),
        }));
    }

    const steps = [
        { key: 'pending', label: 'Đã đặt hàng' },
        { key: 'confirmed', label: 'Xác nhận đơn' },
        { key: 'processing', label: 'Chuẩn bị hàng' },
        { key: 'shipping', label: 'Giao/nhận hàng' },
        { key: 'completed', label: 'Hoàn tất' },
    ];

    const index = Math.max(
        0,
        steps.findIndex((step) => step.key === status),
    );

    return steps.map((step, stepIndex) => ({
        label: step.label,
        time: '',
        done: stepIndex <= index,
    }));
}

export function orderStatusText(status) {
    const map = {
        pending: 'Chờ xử lý',
        confirmed: 'Đã xác nhận',
        processing: 'Đang xử lý',
        shipping: 'Đang giao',
        ready_to_pickup: 'Sẵn sàng nhận hàng',
        delivered: 'Đã giao hàng',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Chờ xử lý';
}
