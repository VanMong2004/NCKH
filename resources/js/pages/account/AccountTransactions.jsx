import { useEffect, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronRight as CrumbRight,
    CreditCard,
    Home,
    ReceiptText,
    Search,
    XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import paymentService from '../../services/paymentService';

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'failed', label: 'Thanh toán thất bại' },
    { value: 'refunded', label: 'Đã hoàn tiền' },
];

const METHOD_OPTIONS = [
    { value: '', label: 'Tất cả phương thức' },
    { value: 'mock_bank', label: 'Chuyển khoản ngân hàng' },
    { value: 'cod', label: 'Thanh toán khi nhận hàng' },
    { value: 'cash_on_pickup', label: 'Thanh toán trực tiếp khi nhận tại phòng' },
];

export default function AccountTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        status: '',
        method: '',
    });

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    useEffect(() => {
        loadTransactions(1);
    }, [filters.status, filters.method]);

    async function loadTransactions(page = 1) {
        try {
            setLoading(true);

            const result = await paymentService.getPaymentHistory({
                page,
                status: filters.status || undefined,
                method: filters.method || undefined,
            });

            setTransactions(result.transactions || []);
            setMeta(
                result.meta || {
                    currentPage: 1,
                    lastPage: 1,
                    total: 0,
                },
            );
        } catch (error) {
            toast.error(error.message || 'Không thể tải lịch sử thanh toán');
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        setFilters({
            status: '',
            method: '',
        });
    }

    return (
        <div>
            <section className="mb-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_78px] gap-2 md:grid-cols-[1fr_1fr_auto] md:gap-3">
                    <select
                        value={filters.status}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                status: e.target.value,
                            }))
                        }
                        className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white md:px-3 md:text-sm"
                    >
                        {STATUS_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.method}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                method: e.target.value,
                            }))
                        }
                        className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white md:px-3 md:text-sm"
                    >
                        {METHOD_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-2 text-xs font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white md:px-5 md:text-sm"
                    >
                        Xóa lọc
                    </button>
                </div>
            </section>

            <div className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Tổng giao dịch: <span className="text-blue-950 dark:text-blue-300">{meta.total}</span>
            </div>

            {loading && <LoadingBox text="Đang tải lịch sử thanh toán..." />}

            {!loading && transactions.length === 0 && <EmptyTransactions />}

            {!loading && transactions.length > 0 && (
                <section className="space-y-4">
                    {transactions.map((transaction) => (
                        <TransactionCard key={transaction.id} transaction={transaction} />
                    ))}
                </section>
            )}

            {!loading && meta.lastPage > 1 && <Pagination meta={meta} onPageChange={loadTransactions} />}
        </div>
    );
}

function TransactionCard({ transaction }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                        <CreditCard size={22} />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-blue-950 dark:text-white">
                                {transaction.orderCode || `Giao dịch #${transaction.id}`}
                            </h3>

                            <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${transaction.statusClass}`}
                            >
                                {transaction.statusText}
                            </span>
                        </div>

                        <div className="mt-2 grid gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            <span>Phương thức: {transaction.methodText}</span>

                            {transaction.transactionId && <span>Mã giao dịch: {transaction.transactionId}</span>}

                            <span>Thời gian: {formatDate(transaction.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-2 justify-between items-center md:flex-col gap-2 md:items-end">
                    <p className="text-xl font-extrabold text-blue-950 dark:text-blue-300">
                        {formatMoney(transaction.amount)}
                    </p>

                    {transaction.orderId && (
                        <Link
                            to={`/account/orders/${transaction.orderId}`}
                            className="rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700"
                        >
                            Xem đơn hàng
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}

function EmptyTransactions() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ReceiptText className="mx-auto text-slate-400" size={42} />

            <p className="mt-3 text-lg font-bold text-blue-950 dark:text-white">Chưa có giao dịch thanh toán</p>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Các giao dịch thanh toán của bạn sẽ hiển thị tại đây.
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

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return '—';

    if (typeof value === 'string' && value.includes('/')) {
        return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('vi-VN');
}
