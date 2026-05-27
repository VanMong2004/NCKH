import { Headphones, ShieldCheck, Truck, BadgeCheck } from 'lucide-react';

export default function CampaignBottomBenefits() {
    const items = [
        {
            icon: BadgeCheck,
            title: 'Sản phẩm chất lượng',
            desc: 'Được kiểm định kỹ lưỡng',
        },
        {
            icon: ShieldCheck,
            title: 'Giá tốt cho sinh viên',
            desc: 'Nhận ưu đãi đặc biệt từ nhà trường',
        },
        {
            icon: Truck,
            title: 'Giao hàng đúng hẹn',
            desc: 'Cam kết đúng thời gian dự kiến',
        },
        {
            icon: Headphones,
            title: 'Hỗ trợ 24/7',
            desc: 'Luôn sẵn sàng hỗ trợ bạn',
        },
    ];

    return (
        <section className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
            {items.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                    <Icon size={24} className="text-blue-950" />
                    <div>
                        <h3 className="font-bold text-blue-950">{title}</h3>
                        <p className="text-sm text-slate-500">{desc}</p>
                    </div>
                </div>
            ))}
        </section>
    );
}
