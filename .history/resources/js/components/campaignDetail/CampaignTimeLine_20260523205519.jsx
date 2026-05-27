import { CalendarDays, Check, Package, Truck, Users } from 'lucide-react';

export default function CampaignTimeline({ campaign = {} }) {
    const items = [
        {
            icon: CalendarDays,
            title: 'Mở đăng ký',
            date: formatDate(campaign.startDate),
            active: true,
        },
        {
            icon: Check,
            title: 'Kết thúc đăng ký',
            date: formatDate(campaign.endDate),
            active: campaign.status !== 'upcoming',
        },
        {
            icon: Users,
            title: 'Tổng hợp đăng ký',
            date: 'Sau khi kết thúc chiến dịch',
            active: campaign.status === 'ended',
        },
        {
            icon: Package,
            title: 'Chuẩn bị sản phẩm',
            date: 'Theo kế hoạch của đơn vị tổ chức',
        },
        {
            icon: Truck,
            title: 'Nhận sản phẩm',
            date: 'Thông báo sau',
        },
    ];

    return (
        <section>
            <h2 className="mb-5 text-xl font-bold text-blue-950 dark:text-white">Timeline chiến dịch</h2>

            <div className="grid gap-4 md:grid-cols-5">
                {items.map(({ icon: Icon, title, date, active }) => (
                    <div
                        key={title}
                        className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div
                            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                                active
                                    ? 'bg-blue-950 text-white dark:bg-blue-700'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}
                        >
                            <Icon size={22} />
                        </div>

                        <h3 className="mt-3 font-bold text-blue-950 dark:text-white">{title}</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{date}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
}
