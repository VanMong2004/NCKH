export default function CampaignStats({ campaign = {} }) {
    const stats = [
        { label: 'Đã đăng ký', value: campaign.registeredQuantity || 0 },
        { label: 'Còn lại', value: campaign.remainingQuantity || 0 },
        { label: 'Sản phẩm', value: campaign.totalItems || campaign.items?.length || 0 },
        { label: 'Trạng thái', value: campaign.statusText || 'Đang cập nhật' },
    ];

    return (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((item) => (
                <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900"
                >
                    <p className="text-2xl font-extrabold text-blue-950 dark:text-white">{item.value}</p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                </div>
            ))}
        </section>
    );
}
