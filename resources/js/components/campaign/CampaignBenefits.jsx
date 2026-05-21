import { Headphones, RotateCcw, ShieldCheck } from 'lucide-react';

export default function CampaignBenefits() {
    const items = [
        {
            icon: ShieldCheck,
            title: 'Chính hãng',
            desc: '100% chính hãng',
        },
        {
            icon: RotateCcw,
            title: 'Đổi trả dễ dàng',
            desc: 'Trong 7 ngày',
        },
        {
            icon: Headphones,
            title: 'Hỗ trợ 24/7',
            desc: 'Luôn sẵn sàng',
        },
    ];

    return (
        <section className="mt-8 grid grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:hidden">
            {items.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center">
                    <Icon size={24} className="mx-auto text-blue-950" />
                    <h3 className="mt-2 text-xs font-bold text-blue-950">{title}</h3>
                    <p className="mt-1 text-[11px] text-slate-500">{desc}</p>
                </div>
            ))}
        </section>
    );
}
