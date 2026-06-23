import { BadgePercent, Home, PackageSearch, ShoppingCart, UserRound } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import { useCart } from '../../contexts/CartContext';

export default function BottomNavigation() {
    const { totalItems } = useCart();
    const location = useLocation();

    const items = [
        { label: 'Trang chủ', to: '/', icon: Home },
        { label: 'Sản phẩm', to: '/shop', icon: PackageSearch },
        { label: 'Khuyến mãi', to: '/promotions', icon: BadgePercent },
        { label: 'Giỏ hàng', to: '/cart', icon: ShoppingCart, badge: totalItems },
        { label: 'Tài khoản', to: '/account/profile', icon: UserRound },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95">
            <div className="grid h-16 grid-cols-5">
                {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(location.pathname, item.to);

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition ${
                                active ? 'text-blue-950 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <div
                                className={`relative rounded-xl px-2 py-1 ${
                                    active ? 'bg-blue-50 dark:bg-blue-950/40' : ''
                                }`}
                            >
                                <Icon size={20} />

                                {item.badge > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>

                            <span className="leading-none">{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}

function isActiveRoute(pathname, to) {
    if (to === '/') {
        return pathname === '/';
    }

    if (to === '/account/profile') {
        return pathname.startsWith('/account');
    }

    return pathname.startsWith(to);
}
