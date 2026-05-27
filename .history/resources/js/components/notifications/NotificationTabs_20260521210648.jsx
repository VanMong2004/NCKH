const tabs = [
    { value: '', label: 'Tất cả' },
    { value: 'unread', label: 'Chưa đọc' },
    { value: 'order', label: 'Đơn hàng' },
    { value: 'payment', label: 'Thanh toán' },
    { value: 'campaign', label: 'Chiến dịch' },
    { value: 'pickup', label: 'Nhận hàng' },
];

export default function NotificationTabs({ activeTab, onChange, notifications = [] }) {
    function countBy(type) {
        if (type === 'unread') {
            return notifications.filter((item) => !item.isRead).length;
        }

        if (!type) return notifications.length;

        return notifications.filter((item) => item.type === type).length;
    }

    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
                const active = activeTab === tab.value;

                return (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => onChange(tab.value)}
                        className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                            active
                                ? 'bg-blue-950 text-white dark:bg-blue-700'
                                : 'border border-slate-200 bg-white text-blue-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
                        }`}
                    >
                        {tab.label} ({countBy(tab.value)})
                    </button>
                );
            })}
        </div>
    );
}
