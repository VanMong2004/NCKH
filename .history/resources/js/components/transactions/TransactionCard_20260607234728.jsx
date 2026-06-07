import { Calendar, CreditCard, Receipt, Wallet } from 'lucide-react';

export default function TransactionCard({ item }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="font-extrabold text-blue-950 dark:text-white">{item.orderCode}</h3>

                        <StatusBadge status={item.status} text={item.statusText} />
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <Info icon={<Wallet size={16} />} text={item.method} />

                        <Info icon={<Receipt size={16} />} text={item.transactionId || 'Chưa có mã giao dịch'} />

                        <Info icon={<Calendar size={16} />} text={formatDate(item.createdAt)} />
                    </div>
                </div>

                <div className="text-left md:text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Số tiền</p>

                    <p className="mt-1 text-2xl font-extrabold text-blue-950 dark:text-blue-300">
                        {formatMoney(item.amount)}
                    </p>
                </div>
            </div>
        </article>
    );
}

function Info({ icon, text }) {
    return (
        <div className="flex items-center gap-2">
            {icon}

            <span>{text}</span>
        </div>
    );
}

function StatusBadge({ status, text }) {
    const map = {
        success: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300',

        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300',

        failed: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300',

        cod_pending: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
    };

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${map[status] || 'bg-slate-100 text-slate-500'}`}>
            {text}
        </span>
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

    return new Date(value).toLocaleString('vi-VN');
}
