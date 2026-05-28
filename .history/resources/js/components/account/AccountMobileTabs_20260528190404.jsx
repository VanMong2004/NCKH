import { NavLink } from 'react-router-dom';
import { Home, MapPin, Package, User, WalletCards, Bell } from 'lucide-react';

const menus = [
    { label: 'Tổng quan', icon: Home, path: '/account/overview' },
    { label: 'Đơn hàng', icon: Package, path: '/account/orders' },
    { label: 'Thanh toán', icon: WalletCards, path: '/account/transactions' },
    { label: 'Hồ sơ', icon: User, path: '/account/profile' },
    { label: 'Địa chỉ', icon: MapPin, path: '/account/addresses' },
];

export default function AccountMobileTabs() {
    return (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {menus.map(({ label, icon: Icon, path }) => (
                <NavLink
                    key={path}
                    to={path}
                    end={path === '/account/overview'}
                    className={({ isActive }) =>
                        `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                            isActive
                                ? 'bg-blue-950 text-white'
                                : 'border border-slate-200 bg-white text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                        }`
                    }
                >
                    <Icon size={16} />
                    {label}
                </NavLink>
            ))}
        </div>
    );
}
