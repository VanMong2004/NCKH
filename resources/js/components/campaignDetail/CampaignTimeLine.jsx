import { CalendarDays, Check, Package, Truck, Users } from 'lucide-react';

export default function CampaignTimeline() {
    const items = [
        {
            icon: CalendarDays,
            title: 'Mở đăng ký',
            date: '01/05/2024 08:00 AM',
            active: true,
        },
        {
            icon: Check,
            title: 'Kết thúc đăng ký',
            date: '31/05/2024 11:59 PM',
            active: true,
        },
        {
            icon: Users,
            title: 'Tổng hợp đơn',
            date: '01/06/2024 - 05/06/2024',
        },
        {
            icon: Package,
            title: 'Sản xuất',
            date: '06/06/2024 - 14/06/2024',
        },
        {
            icon: Truck,
            title: 'Giao hàng',
            date: '15/06/2024 - 25/06/2024',
        },
    ];

    return (
        <section className="mt-6">
            <h2 className="mb-5 text-xl font-bold text-blue-950">Timeline chiến dịch</h2>

            <div className="grid gap-4 md:grid-cols-5">
                {items.map(({ icon: Icon, title, date, active }) => (
                    <div key={title} className="text-center">
                        <div
                            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                                active ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                            <Icon size={22} />
                        </div>

                        <h3 className="mt-3 font-bold text-blue-950">{title}</h3>
                        <p className="mt-1 text-xs text-slate-500">{date}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
