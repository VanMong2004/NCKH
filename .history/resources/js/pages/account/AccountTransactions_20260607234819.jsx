import { useEffect, useState } from 'react';
import { ChevronRight, CreditCard, Home } from 'lucide-react';
import { toast } from 'react-toastify';

import orderService from '../../services/orderService';

import TransactionFilters from '../../components/transactions/TransactionFilters';
import TransactionList from '../../components/transactions/TransactionList';
import TransactionPagination from '../../components/transactions/TransactionPagination';
import paymentService from '../../services/paymentService';

export default function AccountTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        type: '',
    });

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    useEffect(() => {
        loadTransactions();
    }, [filters]);

    async function loadTransactions(page = 1) {
        try {
            setLoading(true);

            const result = await paymentService.getPaymentHistory({
                page,
                status: filters.type || undefined,
            });

            const paymentData = result.orders
                .map((order) => ({
                    id: order.payment?.id || order.id,

                    orderCode: order.code,

                    amount: order.summary?.grandTotal,

                    method: order.payment?.methodText,

                    status: order.payment?.status,

                    statusText: order.payment?.statusText,

                    transactionId: order.payment?.transactionId,

                    createdAt: order.createdAt,
                }))
                .filter((item) => {
                    if (!filters.type) {
                        return true;
                    }

                    return item.status === filters.type;
                });

            setTransactions(result.transactions);
            setMeta(result.meta);
        } catch (error) {
            toast.error(error.message || 'Không thể tải lịch sử thanh toán');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Breadcrumb />

            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Lịch sử thanh toán</h1>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Theo dõi toàn bộ giao dịch thanh toán của bạn
                </p>
            </div>

            <TransactionFilters filters={filters} onChange={setFilters} />

            <TransactionList transactions={transactions} loading={loading} />

            {meta.lastPage > 1 && <TransactionPagination meta={meta} onPageChange={loadTransactions} />}
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <span>Trang chủ</span>

            <ChevronRight size={14} />

            <span>Tài khoản</span>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Lịch sử thanh toán</span>
        </div>
    );
}
