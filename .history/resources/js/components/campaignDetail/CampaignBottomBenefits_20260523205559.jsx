import { BadgeCheck, Headphones, ShieldCheck, Truck } from 'lucide-react';

export default function CampaignBottomBenefits() {
    const items = [
        {
            icon: BadgeCheck,
            title: 'Sản phẩm chất lượng',
            desc: 'Thông tin sản phẩm được kiểm tra trước khi mở chiến dịch.',
        },
        {
            icon: ShieldCheck,
            title: 'Đăng ký minh bạch',
            desc: 'Số lượng đăng ký và trạng thái được cập nhật trên hệ thống.',
        },
        {
            icon: Truck,
            title: 'Nhận hàng theo kế hoạch',
            desc: 'Thời gian nhận hàng được thông báo theo từng chiến dịch.',
        },
        {
            icon: Headphones,
            title: 'Hỗ trợ sinh viên',
            desc: 'Liên hệ bộ phận phụ trách nếu cần hỗ trợ.',
        },
    ];

    return (
        <section className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
            {items.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                    <Icon size={24} className="shrink-0 text-blue-950 dark:text-blue-300" />

                    <div>
                        <h3 className="font-bold text-blue-950 dark:text-white">{title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
                    </div>
                </div>
            ))}
        </section>
    );
}
