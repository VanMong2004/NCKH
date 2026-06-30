import {
    BadgePercent,
    BarChart3,
    Bot,
    FileText,
    LayoutDashboard,
    MessageSquareText,
    Package,
    ShoppingCart,
    Star,
    Users,
    X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const groups = [
    {
        title: 'Tổng quan',
        items: [{ label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true }],
    },
    {
        title: 'Quản lý',
        items: [
            { label: 'Sản phẩm', to: '/admin/products', icon: Package },
            { label: 'Khuyến mãi', to: '/admin/promotions', icon: BadgePercent },
            { label: 'Đơn hàng', to: '/admin/orders', icon: ShoppingCart },
            { label: 'Người dùng', to: '/admin/users', icon: Users },
            { label: 'Đánh giá', to: '/admin/reviews', icon: Star },
            { label: 'Nội dung site', to: '/admin/site-content', icon: FileText },
            { label: 'Tài liệu AI', to: '/admin/chat-knowledge', icon: Bot },
            { label: 'Hội thoại AI', to: '/admin/chat-conversations', icon: MessageSquareText },
        ],
    },
    {
        title: 'Báo cáo',
        items: [{ label: 'Thống kê', to: '/admin/analytics', icon: BarChart3 }],
    },
];

export default function AdminSidebar({ open, onClose }) {
    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label="Đóng menu"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
                />
            )}

            <aside
                className={[
                    'fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900',
                    open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                ].join(' ')}
            >
                <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/logo.png"
                            alt="CTUT Shop"
                            className="h-9 w-9 rounded-lg object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />

                        <div>
                            <h1 className="text-sm font-extrabold text-slate-900 dark:text-white">CTUT Shop</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Admin panel</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-3 py-4">
                    {groups.map((group) => (
                        <div key={group.title} className="mb-5">
                            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                {group.title}
                            </p>

                            <nav className="space-y-1">
                                {group.items.map(({ label, to, icon: Icon, end }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        end={end}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            [
                                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                                                isActive
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                                            ].join(' ')
                                        }
                                    >
                                        <Icon size={18} />
                                        <span>{label}</span>
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
}
