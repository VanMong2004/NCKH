import { BookOpen, ClipboardList, HelpCircle, Info, ShoppingCart } from 'lucide-react';

export default function CampaignTabs() {
    const tabs = [
        { label: 'Thông tin', icon: Info },
        { label: 'Sản phẩm', icon: ShoppingCart },
        { label: 'Hướng dẫn', icon: BookOpen },
        { label: 'Điều kiện', icon: ClipboardList },
        { label: 'FAQ', icon: HelpCircle },
    ];

    return (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white">
            <div className="flex overflow-x-auto border-b border-slate-200">
                {tabs.map(({ label, icon: Icon }, index) => (
                    <button
                        key={label}
                        className={`flex min-w-max items-center gap-2 px-5 py-4 text-sm font-bold ${
                            index === 0 ? 'border-b-2 border-blue-950 text-blue-950' : 'text-slate-500'
                        }`}
                    >
                        <Icon size={18} />
                        {label}
                    </button>
                ))}
            </div>

            <div className="p-5">
                <h2 className="text-xl font-bold text-blue-950">Thông tin chiến dịch</h2>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                    Chiến dịch “Đồng phục ABC 2024” nhằm mang đến bộ đồng phục chất lượng cao, thiết kế hiện đại và giá
                    cả hợp lý cho sinh viên ABC University.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <InfoBox title="Đơn vị tổ chức" value="Đoàn TN - Hội SV ABC" />
                    <InfoBox title="Thời gian đăng ký" value="01/05/2024 - 31/05/2024" />
                    <InfoBox title="Dự kiến giao hàng" value="15/06/2024 - 25/06/2024" />
                    <InfoBox title="Hình thức nhận" value="Nhận tại trường" />
                </div>
            </div>
        </section>
    );
}

function InfoBox({ title, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-blue-950">{title}</p>
            <p className="mt-2 text-sm text-slate-500">{value}</p>
        </div>
    );
}
