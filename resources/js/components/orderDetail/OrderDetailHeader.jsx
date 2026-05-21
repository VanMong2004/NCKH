import { CalendarDays, CheckCircle2, PackageX } from 'lucide-react';
import OrderStatusBadge from '../orders/OrderStatusBadge';

export default function OrderDetailHeader({ order, onCancel, onConfirm }) {
    const canCancel = order.status === 'pending';
    const canConfirm = order.status === 'delivered';

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">Đơn hàng {order.code}</h1>

                        <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-2">
                            <CalendarDays size={16} />
                            {formatDate(order.createdAt)}
                        </span>

                        <span>{order.items?.length || 0} sản phẩm</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {canCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:hover:bg-red-950/30"
                        >
                            <PackageX size={17} />
                            Hủy đơn
                        </button>
                    )}

                    {canConfirm && (
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                            <CheckCircle2 size={17} />
                            Đã nhận hàng
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

function formatDate(value) {
    if (!value) return '—';
    if (typeof value === 'string' && value.includes('/')) return value;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN');
}
