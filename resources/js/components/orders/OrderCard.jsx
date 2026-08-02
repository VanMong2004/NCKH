import { Link } from 'react-router-dom';
import { CalendarDays, CreditCard, Package } from 'lucide-react';

import OrderStatusBadge from './OrderStatusBadge';

export default function OrderCard({ order, onCancel, onConfirm }) {
    const canCancel = order.status === 'pending';
    const canConfirm = order.status === 'awaiting_receipt' && order.fulfillmentMethod === 'pickup';

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">{order.code}</h2>

                        <OrderStatusBadge status={order.status} fulfillmentMethod={order.fulfillmentMethod} />
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <Info icon={<CalendarDays size={16} />} text={formatDate(order.createdAt)} />
                        <Info icon={<Package size={16} />} text={`${order.itemCount || 0} sản phẩm`} />
                        <Info icon={<CreditCard size={16} />} text={order.payment?.statusText || 'Chưa thanh toán'} />
                    </div>
                </div>

                <div className="text-left md:text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tổng tiền</p>

                    <p className="text-2xl font-extrabold text-blue-950 dark:text-blue-300">
                        {formatMoney(order.total)}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <Link
                    to={`/account/orders/${order.id}`}
                    className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                    Xem chi tiết
                </Link>

                {canCancel && (
                    <button
                        type="button"
                        onClick={() => onCancel(order.id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                    >
                        Hủy đơn
                    </button>
                )}

                {canConfirm && (
                    <button
                        type="button"
                        onClick={() => onConfirm(order.id)}
                        className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/30"
                    >
                        Đã nhận hàng
                    </button>
                )}
            </div>
        </article>
    );
}

function Info({ icon, text }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span>{text || '—'}</span>
        </div>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return '—';
    if (typeof value === 'string' && value.includes('/')) return value;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN');
}
