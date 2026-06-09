import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import orderService from '../../services/orderService';

import OrdersHeader from '../../components/orders/OrdersHeader';
import OrdersEmpty from '../../components/orders/OrdersEmpty';
import OrderCard from '../../components/orders/OrderCard';
import OrdersPagination from '../../components/orders/OrdersPagination';

export default function AccountOrders() {
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    useEffect(() => {
        loadOrders(1);
    }, [status]);

    async function loadOrders(page = 1) {
        try {
            setLoading(true);

            const result = await orderService.getMyOrders({
                page,
                status: status || undefined,
            });

            setOrders(result.orders || []);
            setMeta(
                result.meta || {
                    currentPage: 1,
                    lastPage: 1,
                    total: 0,
                },
            );
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel(orderId) {
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

        try {
            await orderService.cancelOrder(orderId);
            toast.success('Đã hủy đơn hàng');
            loadOrders(meta.currentPage);
        } catch (error) {
            toast.error(error.message || 'Không thể hủy đơn hàng');
        }
    }

    async function handleConfirm(orderId) {
        try {
            await orderService.confirmOrder(orderId);
            toast.success('Đã xác nhận nhận hàng');
            loadOrders(meta.currentPage);
        } catch (error) {
            toast.error(error.message || 'Không thể xác nhận đơn hàng');
        }
    }

    return (
        <div className="space-y-6">
            <OrdersHeader status={status} onStatusChange={setStatus} total={meta.total} />

            {loading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-blue-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                    Đang tải đơn hàng...
                </div>
            )}

            {!loading && orders.length === 0 && <OrdersEmpty />}

            {!loading && orders.length > 0 && (
                <section className="space-y-4">
                    {orders.map((order) => (
                        <OrderCard key={order.id} order={order} onCancel={handleCancel} onConfirm={handleConfirm} />
                    ))}
                </section>
            )}

            {!loading && meta.lastPage > 1 && <OrdersPagination meta={meta} onPageChange={loadOrders} />}
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <span>Tài khoản</span>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Địa chỉ</span>
        </div>
    );
}
