import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Package, Search, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import ConfirmDialog from '../../admin/components/ui/ConfirmDialog';
import orderService from '../../services/orderService';
import { cancelReasonText } from '../../services/mappers/orderMapper';

const pickupPaymentText =
    'Thanh toán trực tiếp khi nhận tại Phòng Công tác Chính trị & Quản lý sinh viên Trường Đại học Kỹ thuật - Công nghệ Cần Thơ';

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'processing', label: 'Đang chuẩn bị' },
    { value: 'awaiting_receipt', label: 'Đang giao / Sẵn sàng nhận' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
];

export default function AccountOrders() {
    const [orders, setOrders] = useState([]);
    const [filters, setFilters] = useState({
        status: '',
        keyword: '',
        sort: 'latest',
    });
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
    });

    useEffect(() => {
        loadOrders(1);
    }, [filters.status, filters.sort]);

    useEffect(() => {
        const refreshOrders = () => {
            loadOrders(meta.currentPage || 1);
        };

        window.addEventListener('notification-created', refreshOrders);
        window.addEventListener('notification-updated', refreshOrders);

        return () => {
            window.removeEventListener('notification-created', refreshOrders);
            window.removeEventListener('notification-updated', refreshOrders);
        };
    }, [meta.currentPage, filters]);

    async function loadOrders(page = 1, customFilters = filters) {
        try {
            setLoading(true);

            const result = await orderService.getMyOrders({
                page,
                per_page: 10,
                status: customFilters.status || undefined,
                keyword: customFilters.keyword || undefined,
                sort: customFilters.sort || 'latest',
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

    function handleSearch(e) {
        e.preventDefault();
        loadOrders(1);
    }

    async function cancelOrder(orderId) {
        try {
            await orderService.cancelOrder(orderId);
            toast.success('Đã hủy đơn hàng');
            loadOrders(meta.currentPage);
        } catch (error) {
            toast.error(error.message || 'Không thể hủy đơn hàng');
        }
    }

    function handleCancel(orderId) {
        const order = orders.find((item) => item.id === orderId);

        setConfirmDialog({
            open: true,
            title: 'Xác nhận hủy đơn hàng',
            message: `Bạn có chắc muốn hủy đơn "${order?.code || orderId}"?`,
            description: 'Đơn hàng sau khi hủy sẽ không thể khôi phục lại từ trang người dùng.',
            confirmText: 'Hủy đơn hàng',
            type: 'danger',
            onConfirm: async () => {
                await cancelOrder(orderId);
            },
        });
    }

    return (
        <div>
            <section className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Tổng số đơn: <span className="text-blue-950 dark:text-blue-300">{meta.total}</span>
                </div>

                <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_130px_auto]">
                    <div className="flex h-11 min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
                        <input
                            value={filters.keyword}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    keyword: e.target.value,
                                }))
                            }
                            placeholder="Tìm theo mã đơn hàng..."
                            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none dark:text-white"
                        />

                        <button
                            type="submit"
                            className="flex w-11 shrink-0 items-center justify-center bg-blue-950 text-white dark:bg-blue-700"
                        >
                            <Search size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_64px] gap-3 md:contents">
                        <select
                            value={filters.status}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                }))
                            }
                            className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            {STATUS_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.sort}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    sort: e.target.value,
                                }))
                            }
                            className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="latest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                        </select>

                        <button
                            type="submit"
                            className="h-11 rounded-xl bg-blue-950 px-4 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 md:px-5"
                        >
                            Lọc
                        </button>
                    </div>
                </form>
            </section>

            {loading && <LoadingBox text="Đang tải đơn hàng..." />}

            {!loading && orders.length === 0 && <EmptyOrders />}

            {!loading && orders.length > 0 && (
                <section className="space-y-1">
                    {orders.map((order) => (
                        <OrderCard key={order.id} order={order} onCancel={handleCancel} />
                    ))}
                </section>
            )}

            {!loading && meta.lastPage > 1 && <Pagination meta={meta} onPageChange={loadOrders} />}

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                description={confirmDialog.description}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onOpenChange={(open) => {
                    setConfirmDialog((prev) => ({
                        ...prev,
                        open,
                    }));
                }}
            />
        </div>
    );
}

function OrderCard({ order, onCancel }) {
    const canCancel = Boolean(order.actions?.canCancel);

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                        {order.thumbnail ? (
                            <img
                                src={order.thumbnail}
                                alt={order.title}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                    e.currentTarget.src = '/images/no-image.png';
                                }}
                            />
                        ) : (
                            <Package className="text-slate-400" size={30} />
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-blue-950 dark:text-white">{order.code}</h3>

                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${order.statusClass}`}>
                                {order.statusText}
                            </span>
                        </div>

                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {order.title}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <span>{order.itemCount} sản phẩm</span>
                            <span>Ngày đặt: {order.createdAt || '—'}</span>
                            {order.expiredAt && order.status === 'pending' && <span>Hết hạn: {order.expiredAt}</span>}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Thanh toán: {paymentStatusLabel(order.paymentStatus)}
                            </span>

                            {order.paymentMethod && (
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                                    {paymentMethodLabel(order.paymentMethod)}
                                </span>
                            )}

                            {order.cancelReason && (
                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                                    {cancelReasonText(order.cancelReason)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-2 items-center justify-between gap-2 md:flex-col md:items-end">
                    <p className="text-xl font-extrabold text-blue-950 dark:text-blue-300">
                        {formatMoney(order.total)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            to={`/account/orders/${order.id}`}
                            className="rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700"
                        >
                            Xem chi tiết
                        </Link>

                        {canCancel && (
                            <button
                                type="button"
                                onClick={() => onCancel(order.id)}
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                            >
                                Hủy đơn
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function EmptyOrders() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <XCircle className="mx-auto text-slate-400" size={42} />
            <p className="mt-3 text-lg font-bold text-blue-950 dark:text-white">Chưa có đơn hàng</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Các đơn hàng của bạn sẽ hiển thị tại đây.
            </p>
            <Link
                to="/shop"
                className="mt-5 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white dark:bg-blue-700"
            >
                Tiếp tục mua sắm
            </Link>
        </div>
    );
}

function LoadingBox({ text }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-blue-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            {text}
        </div>
    );
}

function Pagination({ meta, onPageChange }) {
    const current = Number(meta.currentPage || 1);
    const last = Number(meta.lastPage || 1);

    return (
        <div className="mt-6 flex items-center justify-center gap-2">
            <button
                type="button"
                disabled={current <= 1}
                onClick={() => onPageChange(current - 1)}
                className="rounded-xl border border-slate-300 bg-white p-2 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
            >
                <ChevronLeft size={18} />
            </button>

            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-blue-950 dark:bg-slate-800 dark:text-white">
                Trang {current} / {last}
            </span>

            <button
                type="button"
                disabled={current >= last}
                onClick={() => onPageChange(current + 1)}
                className="rounded-xl border border-slate-300 bg-white p-2 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

function paymentStatusLabel(status) {
    const map = {
        unpaid: 'Chưa thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thanh toán thất bại',
        cancelled: 'Đã hủy',
        refunded: 'Đã hoàn tiền',
    };

    return map[status] || 'Chưa tạo thanh toán';
}

function paymentMethodLabel(method) {
    const map = {
        cod: 'Thanh toán khi nhận hàng',
        mock_bank: 'Chuyển khoản ngân hàng',
        cash_on_pickup: pickupPaymentText,
    };

    return map[method] || 'Chưa xác định';
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
