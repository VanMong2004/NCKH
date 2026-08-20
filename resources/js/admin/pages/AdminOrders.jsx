import { Eye, Loader2, RefreshCcw, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import AdminOrderDetailModal from '../components/orders/AdminOrderDetailModal';
import {
    formatMoney,
    getDisplayOrderStatusText,
    getPaymentMethodText,
    getPaymentStatusText,
    getVatInvoiceStatusText,
} from '../mappers/adminOrderMapper';
import adminOrderService from '../services/adminOrderService';
import StatCard from '../components/ui/StatCard';

const orderStatusOptions = [
    { value: '', label: 'Tất cả trạng thái đơn hàng' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'processing', label: 'Đang chuẩn bị' },
    { value: 'awaiting_receipt', label: 'Đang giao hoặc sẵn sàng nhận' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
];

const paymentStatusOptions = [
    { value: '', label: 'Tất cả trạng thái thanh toán' },
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'failed', label: 'Thanh toán thất bại' },
    { value: 'refunded', label: 'Đã hoàn tiền' },
];

const vatInvoiceStatusOptions = [
    { value: '', label: 'Tất cả hóa đơn giá trị gia tăng' },
    { value: 'none', label: 'Không có yêu cầu' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'fulfilled', label: 'Đã hoàn tất' },
    { value: 'rejected', label: 'Đã từ chối' },
];

const sortOptions = [
    { value: 'latest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        payment_status: '',
        vat_invoice_status: '',
        date_from: '',
        date_to: '',
        sort: 'latest',
        page: 1,
        per_page: 10,
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
    });

    const [detailState, setDetailState] = useState({
        open: false,
        orderId: null,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedKeyword,
        filters.status,
        filters.payment_status,
        filters.vat_invoice_status,
        filters.date_from,
        filters.date_to,
        filters.sort,
        filters.page,
        filters.per_page,
    ]);

    useEffect(() => {
        if (!window.Echo) return undefined;

        const token = localStorage.getItem('ctut_token');
        const authHeaders = window.Echo?.connector?.pusher?.config?.auth?.headers;

        if (authHeaders) {
            authHeaders.Authorization = token ? `Bearer ${token}` : '';
        }

        const channelName = 'admin.analytics';
        const channel = window.Echo.private(channelName).listen('.analytics.updated', () => {
            loadOrders();
        });

        return () => {
            channel.stopListening('.analytics.updated');
            window.Echo.leave(channelName);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedKeyword,
        filters.status,
        filters.payment_status,
        filters.vat_invoice_status,
        filters.date_from,
        filters.date_to,
        filters.sort,
        filters.page,
        filters.per_page,
    ]);

    async function loadOrders() {
        try {
            setLoading(true);

            const result = await adminOrderService.getOrders({
                keyword: debouncedKeyword || undefined,
                status: filters.status || undefined,
                payment_status: filters.payment_status || undefined,
                vat_invoice_status: filters.vat_invoice_status || undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
                sort: filters.sort || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setOrders(result.orders || []);
            setMeta(
                result.meta || {
                    currentPage: 1,
                    lastPage: 1,
                    perPage: filters.per_page,
                    total: 0,
                },
            );
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    }

    function updateFilter(key, value) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? value : 1,
        }));
    }

    function resetFilters() {
        setFilters({
            keyword: '',
            status: '',
            payment_status: '',
            vat_invoice_status: '',
            date_from: '',
            date_to: '',
            sort: 'latest',
            page: 1,
            per_page: 10,
        });

        setDebouncedKeyword('');
    }

    function openDetail(order) {
        setDetailState({
            open: true,
            orderId: order.id,
        });
    }

    function closeDetail() {
        setDetailState({
            open: false,
            orderId: null,
        });
    }

    async function handleUpdatedOrder() {
        await loadOrders();
    }

    const summary = useMemo(() => {
        return {
            total: meta.total,
            pending: orders.filter((item) => item.status === 'pending').length,
            processing: orders.filter((item) => item.status === 'processing').length,
            completed: orders.filter((item) => item.status === 'completed').length,
            cancelled: orders.filter((item) => item.status === 'cancelled').length,
            revenue: orders
                .filter((item) => item.status !== 'cancelled')
                .reduce((sum, item) => sum + Number(item.total || 0), 0),
        };
    }, [orders, meta.total]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đơn hàng</h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi đơn hàng, thanh toán, hóa đơn giá trị gia tăng và xử lý trạng thái.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadOrders}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    Tải lại
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard label="Tổng đơn" value={summary.total} tone="blue" />
                <StatCard label="Chờ xác nhận" value={summary.pending} tone="amber" />
                <StatCard label="Đang chuẩn bị" value={summary.processing} tone="violet" />
                <StatCard label="Hoàn thành" value={summary.completed} tone="emerald" />
                <StatCard label="Đã hủy" value={summary.cancelled} tone="gray" />
                <StatCard label="Doanh thu" value={formatMoney(summary.revenue)} tone="rose" />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
                        {/* Tìm kiếm */}
                        <div className="relative md:col-span-2 xl:col-span-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                value={filters.keyword}
                                onChange={(e) => updateFilter('keyword', e.target.value)}
                                placeholder="Tìm mã đơn, khách hàng..."
                                className={controlClass + ' pl-9'}
                            />
                        </div>

                        {/* Trạng thái đơn */}
                        <select
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className={controlClass + ' xl:col-span-3'}
                        >
                            {orderStatusOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {/* Trạng thái thanh toán */}
                        <select
                            value={filters.payment_status}
                            onChange={(e) => updateFilter('payment_status', e.target.value)}
                            className={controlClass + ' xl:col-span-3'}
                        >
                            {paymentStatusOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {/* Hóa đơn giá trị gia tăng */}
                        <select
                            value={filters.vat_invoice_status}
                            onChange={(e) => updateFilter('vat_invoice_status', e.target.value)}
                            className={controlClass + ' md:col-span-2 xl:col-span-2'}
                        >
                            {vatInvoiceStatusOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {/* Từ ngày */}
                        <div className="xl:col-span-3">
                            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Từ ngày
                            </label>

                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => updateFilter('date_from', e.target.value)}
                                className={controlClass}
                            />
                        </div>

                        {/* Đến ngày */}
                        <div className="xl:col-span-3">
                            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Đến ngày
                            </label>

                            <input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => updateFilter('date_to', e.target.value)}
                                className={controlClass}
                            />
                        </div>

                        {/* Sắp xếp */}
                        <div className="xl:col-span-3">
                            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Sắp xếp
                            </label>

                            <select
                                value={filters.sort}
                                onChange={(e) => updateFilter('sort', e.target.value)}
                                className={controlClass}
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Đặt lại */}
                        <div className="flex items-end xl:col-span-3">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Đặt lại bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Đơn hàng</Th>
                                <Th>Khách hàng</Th>
                                <Th>Thanh toán</Th>
                                <Th>Hóa đơn giá trị gia tăng</Th>
                                <Th className="text-center">Sản phẩm</Th>
                                <Th>Tổng tiền</Th>
                                <Th>Trạng thái đơn</Th>
                                <Th>Ngày đặt</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Đang tải đơn hàng...</p>
                                    </td>
                                </tr>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={order.thumbnail}
                                                    alt={order.orderCode}
                                                    className="h-12 w-12 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/images/no-image.png';
                                                    }}
                                                />

                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        {order.orderCode || `#${order.id}`}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-500">ID: {order.id}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {order.customer.name || 'Khách hàng'}
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {order.customer.phone || order.customer.email || '—'}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="space-y-1">
                                                <PaymentBadge status={order.paymentStatus}>
                                                    {getPaymentStatusText(order.paymentStatus)}
                                                </PaymentBadge>

                                                <p className="text-xs text-slate-500">
                                                    {getPaymentMethodText(order.paymentMethod)}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            {order.vatInvoiceRequest ? (
                                                <VatInvoiceBadge status={order.vatInvoiceRequest.status}>
                                                    {getVatInvoiceStatusText(order.vatInvoiceRequest.status)}
                                                </VatInvoiceBadge>
                                            ) : (
                                                <span className="text-xs text-slate-400">Không có yêu cầu</span>
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center text-slate-700 dark:text-slate-200">
                                            {order.itemCount || 0}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {formatMoney(order.total)}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <OrderStatusBadge status={order.status}>
                                                {getDisplayOrderStatusText(order.status, order.fulfillmentMethod)}
                                            </OrderStatusBadge>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                                            {order.createdAt || '—'}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => openDetail(order)}
                                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                <Eye size={15} />
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <ShoppingCart size={30} className="mx-auto text-slate-300" />

                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                                            Không có đơn hàng phù hợp
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Thử đổi từ khóa hoặc đặt lại bộ lọc.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <p className="text-sm text-slate-500">
                        Hiển thị <b>{orders.length}</b> / <b>{meta.total}</b> đơn hàng
                    </p>

                    <div className="flex items-center gap-2">
                        <select
                            value={filters.per_page}
                            onChange={(e) => updateFilter('per_page', Number(e.target.value))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                        </select>

                        <button
                            type="button"
                            disabled={meta.currentPage <= 1 || loading}
                            onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                            Trước
                        </button>

                        <span className="min-w-[80px] text-center text-sm text-slate-500">
                            {meta.currentPage}/{meta.lastPage}
                        </span>

                        <button
                            type="button"
                            disabled={meta.currentPage >= meta.lastPage || loading}
                            onClick={() => updateFilter('page', Math.min(meta.lastPage, filters.page + 1))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </section>

            <AdminOrderDetailModal
                open={detailState.open}
                orderId={detailState.orderId}
                onClose={closeDetail}
                onUpdated={handleUpdatedOrder}
            />
        </div>
    );
}

function Th({ children, className = '' }) {
    return (
        <th
            scope="col"
            className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}
        >
            {children}
        </th>
    );
}

function OrderStatusBadge({ status, children }) {
    const key = String(status || '').toLowerCase();

    const className =
        key === 'completed'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : key === 'cancelled'
              ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
              : key === 'processing' || key === 'awaiting_receipt'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>
    );
}

function PaymentBadge({ status, children }) {
    const key = String(status || '').toLowerCase();

    const className =
        key === 'paid'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : key === 'failed'
              ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
              : key === 'refunded'
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>
    );
}

function VatInvoiceBadge({ status, children }) {
    const key = String(status || '').toLowerCase();

    const className =
        key === 'fulfilled'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : key === 'rejected'
              ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
              : key === 'processing'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>
    );
}

const controlClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
