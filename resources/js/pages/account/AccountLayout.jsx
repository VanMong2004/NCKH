import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, ChevronRight, Home, MapPin, Megaphone, Package, User, WalletCards } from 'lucide-react';

import MainLayout from '../../layout/MainLayout';
import AccountSidebar from '../../components/account/AccountSidebar';
import AccountMobileTabs from '../../components/account/AccountMobileTabs';

const accountTabs = [
    { label: 'Tổng quan', mobileLabel: 'Tổng quan', icon: Home, path: '/account/overview', end: true },
    { label: 'Thông tin cá nhân', mobileLabel: 'Hồ sơ', icon: User, path: '/account/profile' },
    { label: 'Địa chỉ nhận hàng', mobileLabel: 'Địa chỉ', icon: MapPin, path: '/account/addresses' },
    { label: 'Đơn hàng của tôi', mobileLabel: 'Đơn hàng', icon: Package, path: '/account/orders' },
    { label: 'Lịch sử thanh toán', mobileLabel: 'Thanh toán', icon: WalletCards, path: '/account/transactions' },
    { label: 'Thông báo', mobileLabel: 'Thông báo', icon: Bell, path: '/account/notifications' },
];

export default function AccountLayout() {
    const location = useLocation();
    const breadcrumbs = buildBreadcrumbs(location.pathname);

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-2">
                <AccountBreadcrumb items={breadcrumbs} />

                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                    <AccountSidebar menus={accountTabs} />

                    <section className="min-w-0">
                        <AccountMobileTabs menus={accountTabs} />

                        <Outlet />
                    </section>
                </div>
            </main>
        </MainLayout>
    );
}

function AccountBreadcrumb({ items }) {
    return (
        <div className="mb-2 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>

            <ChevronRight size={14} />

            <Link to="#" className="hover:text-blue-950 dark:hover:text-blue-300">
                Tài khoản
            </Link>

            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
                        <ChevronRight size={14} />

                        {item.path && !isLast ? (
                            <Link to={item.path} className="hover:text-blue-950 dark:hover:text-blue-300">
                                {item.label}
                            </Link>
                        ) : (
                            <span className={isLast ? 'text-blue-950 dark:text-blue-300' : ''}>{item.label}</span>
                        )}
                    </span>
                );
            })}
        </div>
    );
}

function buildBreadcrumbs(pathname) {
    if (/^\/account\/orders\/[^/]+/.test(pathname)) {
        return [{ label: 'Đơn hàng của tôi', path: '/account/orders' }, { label: 'Chi tiết đơn hàng' }];
    }

    const currentTab =
        accountTabs.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)) || accountTabs[0];

    return [{ label: currentTab.label }];
}
