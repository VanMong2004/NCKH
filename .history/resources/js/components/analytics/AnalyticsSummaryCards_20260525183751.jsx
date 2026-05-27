import { CheckCircle2, ReceiptText, TrendingUp, Users } from 'lucide-react';

export default function AnalyticsSummaryCards({ overview }) {
    const cards = [
        {
            label: 'Tổng đơn hàng',
            value: overview.totalOrders,
            icon: ReceiptText,
        },
        {
            label: 'Đơn đã thanh toán',
            value: overview.paidOrders,
            icon: CheckCircle2,
        },
        {
            label: 'Doanh thu',
            value: formatMoney(overview.revenue),
            icon: TrendingUp,
        },
        {
            label: 'Người dùng',
            value: overview.totalUsers,
            icon: Users,
        },
    ];

    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon }) => (
                <article
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>

                            <p className="mt-2 text-2xl font-extrabold text-blue-950 dark:text-white">{value}</p>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
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
