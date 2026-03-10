// components/account/OrdersHistory/OrdersTabs.jsx
export default function OrdersTabs({ tabs, activeTab, onTabChange }) {
    return (
        <div className="relative">
            <div className="flex overflow-x-auto scrollbar-hide border-b border-default">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                            activeTab === tab.key ? 'text-blue-600 dark:text-blue-500' : 'text-muted hover:text-title'
                        }`}
                    >
                        <span className="flex items-center gap-0.5">
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="text-xs font-semibold min-w-[20px]">
                                    ({tab.count})
                                </span>
                            )}
                        </span>
                        {/* Gạch dưới khi active */}
                        {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
