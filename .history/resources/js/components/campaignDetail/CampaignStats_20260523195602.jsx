export default function CampaignStats({ campaign = {} }) {
    const stats = [
        {
            label: 'Đã đăng ký',
            value: campaign.registeredQuantity || 0,
        },
        {
            label: 'Còn lại',
            value: campaign.remainingQuantity || 0,
        },
        {
            label: 'Sản phẩm',
            value: campaign.totalItems || 0,
        },
        {
            label: 'Trạng thái',
            value: campaign.statusText || '---',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((item, index) => (
                <div
                    key={index}
                    className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    p-4
                    text-center
                    dark:border-slate-800
                    dark:bg-slate-900
                    "
                >
                    <p className="text-2xl font-extrabold text-blue-950 dark:text-white">{item.value}</p>

                    <p className="mt-2 text-sm text-slate-500">{item.label}</p>
                </div>
            ))}
        </div>
    );
}
