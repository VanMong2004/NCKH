import { ChevronDown } from 'lucide-react';

function AccountSidebarMobile({ showAccountMenu, onShowAccountMenu, activeTab, onActiveTab }) {
    return (
        <>
            {/* Header mobile */}
            <div className="lg:hidden card p-4 flex items-center gap-3 mb-4">
                <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nguyen"
                    alt="User avatar"
                    className="w-12 h-12 rounded-full"
                />

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-title truncate">Lê Văn Mộng</p>
                    <p className="text-sm text-muted">ID: KTPM2211055</p>
                </div>

                <button
                    onClick={() => onShowAccountMenu((prev) => !prev)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ChevronDown className="w-5 h-5 text-body" />
                </button>
            </div>

            {/* Menu dropdown */}
            {showAccountMenu && (
                <div className="lg:hidden card divide-y border-default mb-4">
                    {[
                        { id: 'details', label: 'Thông tin chi tiết' },
                        { id: 'orders', label: 'Đơn hàng' },
                        { id: 'addresses', label: 'Địa chỉ' },
                        { id: 'payment', label: 'Thanh toán' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onActiveTab(item.id);
                                onShowAccountMenu(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-base font-medium transition-colors ${
                                activeTab === item.id
                                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                                    : 'text-body hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}

export default AccountSidebarMobile;
