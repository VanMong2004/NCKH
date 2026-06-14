import { Bell, HelpCircle, Home, LogOut, MapPin, Megaphone, Package, Settings, User, WalletCards } from 'lucide-react';

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AccountSidebar() {
    const { logout } = useAuth();

    const menus = [
        { label: 'Tổng quan', icon: Home, path: '/account/overview' },
        { label: 'Thông tin cá nhân', icon: User, path: '/account/profile' },
        { label: 'Đơn hàng của tôi', icon: Package, path: '/account/orders' },
        { label: 'Lịch sử thanh toán', icon: WalletCards, path: '/account/transactions' },
        { label: 'Địa chỉ nhận hàng', icon: MapPin, path: '/account/addresses' },
        { label: 'Chiến dịch của tôi', icon: Megaphone, path: '/account/campaigns' },
        { label: 'Thông báo', icon: Bell, path: '/account/notifications' },
        // { label: 'Cài đặt', icon: Settings, path: '/account/settings' },
    ];

    async function handleLogout() {
        await logout();
    }

    return (
        <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <nav className="space-y-1">
                    {menus.map(({ label, icon: Icon, path }) => (
                        <NavLink
                            key={label}
                            to={path}
                            end={path === '/account/overview'}
                            className={({ isActive }) =>
                                `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                        : 'text-blue-950 hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                        <LogOut size={18} />
                        Đăng xuất
                    </button>
                </nav>

                <div className="mt-6 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/40">
                    <HelpCircle size={26} className="text-blue-950 dark:text-blue-300" />

                    <h3 className="mt-3 font-bold text-blue-950 dark:text-white">Cần hỗ trợ?</h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Đội ngũ hỗ trợ luôn sẵn sàng giúp bạn.
                    </p>

                    <button className="mt-4 w-full rounded-lg border border-blue-950 py-2 text-sm font-bold text-blue-950 dark:border-blue-300 dark:text-blue-300">
                        Liên hệ hỗ trợ
                    </button>
                </div>
            </div>
        </aside>
    );
}
