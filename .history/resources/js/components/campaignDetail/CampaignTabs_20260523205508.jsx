import { BookOpen, ClipboardList, HelpCircle, Info, ShoppingCart } from 'lucide-react';

export default function CampaignTabs({ campaign = {} }) {
    const tabs = [
        { label: 'Thông tin', icon: Info },
        { label: 'Sản phẩm', icon: ShoppingCart },
        { label: 'Hướng dẫn', icon: BookOpen },
        { label: 'Điều kiện', icon: ClipboardList },
        { label: 'FAQ', icon: HelpCircle },
    ];

    return (
        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800">
                {tabs.map(({ label, icon: Icon }, index) => (
                    <button
                        key={label}
                        type="button"
                        className={`flex min-w-max items-center gap-2 px-5 py-4 text-sm font-bold ${
                            index === 0
                                ? 'border-b-2 border-blue-950 text-blue-950 dark:border-blue-300 dark:text-blue-300'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Icon size={18} />
                        {label}
                    </button>
                ))}
            </div>

            <div className="p-5">
                <h2 className="text-xl font-bold text-blue-950 dark:text-white">Thông tin chiến dịch</h2>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {campaign.description || 'Thông tin chi tiết chiến dịch đang được cập nhật.'}
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <InfoBox title="Thời gian bắt đầu" value={formatDate(campaign.startDate)} />
                    <InfoBox title="Thời gian kết thúc" value={formatDate(campaign.endDate)} />
                    <InfoBox title="Hình thức nhận" value="Nhận theo hướng dẫn của nhà trường" />
                </div>
            </div>
        </section>
    );
}

function InfoBox({ title, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm font-bold text-blue-950 dark:text-white">{title}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{value || '—'}</p>
        </div>
    );
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
}
