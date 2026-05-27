import { mapPayment } from './paymentMapper';

export function mapOrder(item = {}) {
    const summary = item.summary || {};

    const paymentRaw = item.payment || {
        method: item.payment_method || 'cod',
        status:
            item.payment_status ||
            (item.payment_method === 'cod' && item.status === 'completed'
                ? 'cod_paid'
                : item.payment_method === 'cod'
                  ? 'cod_pending'
                  : 'pending'),
        amount: summary.grand_total || item.grand_total || item.total || 0,
    };

    const payment = mapPayment(paymentRaw);

    return {
        id: item.id || item.order_id,

        code: item.order_code || item.code || '',

        title: item.title || item.order_code || '',

        type: item.type || 'product',

        status: item.status || 'pending',

        statusText: orderStatusText(item.status),

        createdAt: item.created_at || item.order_date || item.timeline?.[0]?.time || '',

        thumbnail: item.thumbnail || '/images/no-image.png',

        itemCount: Number(item.item_count || item.items_count || item.items?.length || item.order_items?.length || 0),

        qrCode: item.qr_code || item.order_code || '',

        detailUrl: item.detail_url || '',

        receiver: mapReceiver(item.receiver || item.address || item),

        payment,

        summary: {
            subTotal: Number(summary.sub_total || item.sub_total || 0),

            shippingFee: Number(summary.shipping_fee || item.shipping_fee || 0),

            discount: Number(summary.discount || item.discount || 0),

            grandTotal: Number(summary.grand_total || item.grand_total || item.total_amount || item.total || 0),
        },

        items: mapOrderItems(item.items || item.order_items || []),

        pickup: {
            location: item.pickup?.location || item.pickup_location || '',

            instruction: item.pickup?.instruction || item.pickup_instruction || '',
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

    return {
        orders: Array.isArray(raw) ? raw.map(mapOrder) : [],

        meta: {
            currentPage: Number(
                response.meta?.current_page || response.current_page || response.data?.current_page || 1,
            ),

            lastPage: Number(response.meta?.last_page || response.last_page || response.data?.last_page || 1),

            total: Number(response.meta?.total || response.total || response.data?.total || raw.length || 0),
        },
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
    return items.map((item) => {
        const price = Number(item.price || 0);
        const quantity = Number(item.quantity || 0);

        return {
            id: item.id,

            productId: item.product_id || item.product?.id,

            variantId: item.product_variant_id || item.variant?.id,

            productName: item.product_name || item.name || item.product?.name || 'Sản phẩm',

            slug: item.slug || item.product?.slug || '',

            thumbnail: item.thumbnail || item.image || item.product?.thumbnail || '/images/no-image.png',

            quantity,

            price,

            total: Number(item.total || price * quantity || 0),

            variant: {
                size: item.variant?.size || item.size || '',

                color: item.variant?.color || item.color || '',
            },

            raw: item,
        };
    });
}

function mapTimeline(timeline = [], status = 'pending') {
    if (timeline.length > 0) {
        return timeline.map((item) => ({
            label: item.label,
            time: item.time,
            done: Boolean(item.status || item.done),
        }));
    }

    const steps = [
        { key: 'pending', label: 'Đã đặt hàng' },
        { key: 'confirmed', label: 'Đã xác nhận' },
        { key: 'processing', label: 'Đang chuẩn bị' },
        { key: 'shipping', label: 'Đang giao/nhận' },
        { key: 'completed', label: 'Hoàn thành' },
    ];

    const currentIndex = steps.findIndex((step) => step.key === status);

    const safeIndex = currentIndex === -1 ? 0 : currentIndex;

    return steps.map((step, index) => ({
        label: step.label,
        time: '',
        done: index <= safeIndex,
    }));
}

export function orderStatusText(status) {
    const map = {
        pending: 'Chờ xử lý',
        confirmed: 'Đã xác nhận',
        processing: 'Đang chuẩn bị',
        shipping: 'Đang giao',
        ready_to_pickup: 'Sẵn sàng nhận hàng',
        delivered: 'Đã giao hàng',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Chờ xử lý';
}
