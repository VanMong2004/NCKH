import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, ChevronDown, Home, MapPin, Menu, Package, Settings, User, WalletCards, X } from 'lucide-react';

const menus = [
    { label: 'Tổng quan', icon: Home, path: '/account' },
    { label: 'Đơn hàng của tôi', icon: Package, path: '/account/orders' },
    { label: 'Lịch sử thanh toán', icon: WalletCards, path: '/account/transactions' },
    { label: 'Thông tin cá nhân', icon: User, path: '/account/profile' },
    { label: 'Địa chỉ nhận hàng', icon: MapPin, path: '/account/addresses' },
    { label: 'Thông báo', icon: Bell, path: '/account/notifications' },
    { label: 'Cài đặt', icon: Settings, path: '/account/settings' },
];

export default function AccountMobileMenu() {
    const [open, setOpen] = useState(false);

    return (
        <div className="mb-5 lg:hidden">
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-blue-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
                <span className="flex items-center gap-2">
                    <Menu size={18} />
                    Menu tài khoản
                </span>

                <ChevronDown size={18} />
            </button>

            {open && (
                <div className="fixed inset-0 z-50">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-black/40"
                        aria-label="Đóng menu"
                    />

                    <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">Menu tài khoản</h2>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="grid gap-2">
                            {menus.map(({ label, icon: Icon, path }) => (
                                <NavLink
                                    key={path}
                                    to={path}
                                    end={path === '/account'}
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${
                                            isActive
                                                ? 'bg-blue-950 text-white dark:bg-blue-700'
                                                : 'bg-slate-50 text-blue-950 dark:bg-slate-800 dark:text-white'
                                        }`
                                    }
                                >
                                    <Icon size={18} />
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}
