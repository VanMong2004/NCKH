import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import orderService from '../../services/orderService';

import OrderDetailHeader from '../../components/orderDetail/OrderDetailHeader';
import OrderDetailItems from '../../components/orderDetail/OrderDetailItems';
import OrderShippingInfo from '../../components/orderDetail/OrderShippingInfo';
import OrderDetailSummary from '../../components/orderDetail/OrderDetailSummary';
import OrderPaymentInfo from '../../components/orderDetail/OrderPaymentInfo';
import { ChevronRight, Home } from 'lucide-react';

export default function AccountOrderDetail() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [id]);

    async function loadOrder() {
        try {
            setLoading(true);

            const result = await orderService.getOrderDetail(id);

            setOrder(result);
        } catch (error) {
            toast.error(error.message || 'Không thể tải chi tiết đơn hàng');
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

        try {
            const result = await orderService.cancelOrder(order.id);

            setOrder(result);
            toast.success('Đã hủy đơn hàng');
        } catch (error) {
            toast.error(error.message || 'Không thể hủy đơn hàng');
        }
    }

    async function handleConfirm() {
        try {
            const result = await orderService.confirmOrder(order.id);

            setOrder(result);
            toast.success('Đã xác nhận nhận hàng');
        } catch (error) {
            toast.error(error.message || 'Không thể xác nhận đơn hàng');
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-blue-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                Đang tải chi tiết đơn hàng...
            </div>
        );
    }

    if (!order) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Không tìm thấy đơn hàng.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <OrderDetailHeader order={order} onCancel={handleCancel} onConfirm={handleConfirm} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-6">
                    <OrderDetailItems order={order} />
                    <OrderShippingInfo order={order} />
                </div>

                <div className="min-w-0 space-y-6">
                    <OrderDetailSummary order={order} />
                    <OrderPaymentInfo order={order} />
                </div>
            </div>
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
