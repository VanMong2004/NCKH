'use client';

import { LayoutDashboard, Package, MapPin, CreditCard, User, LogOut } from 'lucide-react';

const MENU_ITEMS = [
    { id: 'thongtinchitiet', label: 'Thông tin chi tiết', icon: User },
    { id: 'donhang', label: 'Đơn hàng', icon: Package },
    { id: 'diachicanhan', label: 'Địa chỉ', icon: MapPin },
    { id: 'thanhtoan', label: 'Thanh toán', icon: CreditCard },
];

export default function AccountSidebar({ activeTab, onTabChange }) {
    return (
        <div className="card overflow-hidden">
            {/* Thông tin người dùng */}
            <div className="p-4 border-b border-default">
                <div className="flex items-center gap-3 mb-4">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nguyen"
                        alt="User avatar"
                        className="w-12 h-12 rounded-full"
                    />
                    <div className="min-w-0">
                        <p className="font-semibold text-title truncate">Lê Văn Mộng</p>
                        <p className="text-sm text-muted">ID: KTPM2211055</p>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <nav className="space-y-1 p-2">
                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                isActive
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                                    : 'text-body hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-2 border-t border-default">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
                    <LogOut className="w-5 h-5" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
}
