import { CircleDollarSign, PackageCheck, ReceiptText, TrendingUp } from 'lucide-react';

export default function AnalyticsMetricCards({ analytics }) {
    const summary = analytics?.summary || {};
    const orders = analytics?.orders || {};
    const completedOrders = orders.statusBreakdown?.find((item) => item.status === 'completed')?.total || 0;
    const processingOrders = orders.statusBreakdown?.find((item) => item.status === 'processing')?.total || 0;

    const cards = [
        {
            label: 'Tổng đơn hàng',
            value: summary.totalOrders || 0,
            note: 'Tất cả đơn đã tạo',
            icon: ReceiptText,
            color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
        },
        {
            label: 'Tổng chi tiêu',
            value: formatMoney(summary.totalSpent),
            note: 'Tổng tiền đã mua',
            icon: CircleDollarSign,
            color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        },
        {
            label: 'Đơn hoàn thành',
            value: completedOrders,
            note: 'Đã hoàn tất',
            icon: PackageCheck,
            color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
        },
        {
            label: 'Đang xử lý',
            value: processingOrders,
            note: 'Cần theo dõi',
            icon: TrendingUp,
            color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
        },
    ];

    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, note, icon: Icon, color }) => (
                <article
                    key={label}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                            <p className="mt-3 truncate text-2xl font-extrabold text-blue-950 dark:text-white">
                                {value}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">{note}</p>
                        </div>

                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                            <Icon size={24} />
                        </div>
                    </div>
                </article>
            ))}
        </section>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
