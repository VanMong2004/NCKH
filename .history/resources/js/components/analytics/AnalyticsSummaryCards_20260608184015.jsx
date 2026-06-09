import { BadgeCheck, CircleDollarSign, ReceiptText, Target } from 'lucide-react';

export default function AnalyticsSummaryCards({ analytics }) {
    const summary = analytics?.summary || {};

    const cards = [
        {
            label: 'Tổng đơn hàng',
            value: summary.totalOrders || 0,
            icon: ReceiptText,
        },
        {
            label: 'Tổng chi tiêu',
            value: formatMoney(summary.totalSpent),
            icon: CircleDollarSign,
        },
        {
            label: 'Campaign đã đăng ký',
            value: summary.totalCampaigns || 0,
            icon: Target,
        },
        {
            label: 'Campaign đang hoạt động',
            value: summary.activeCampaigns || 0,
            icon: BadgeCheck,
        },
    ];

    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon }) => (
                <article
                    key={label}
                    className="
                        group
                        rounded-3xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                        shadow-sm
                        transition-all
                        hover:-translate-y-1
                        hover:shadow-md
                        dark:border-slate-800
                        dark:bg-slate-900
                    "
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>

                            <p className="mt-3 truncate text-3xl font-extrabold text-blue-950 dark:text-white">
                                {value}
                            </p>
                        </div>

                        <div
                            className="
                                flex
                                h-14
                                w-14
                                shrink-0
                                items-center
                                justify-center
                                rounded-2xl
                                bg-blue-50
                                text-blue-950
                                transition
                                group-hover:scale-105
                                dark:bg-blue-950/40
                                dark:text-blue-300
                            "
                        >
                            <Icon size={26} />
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
