import { LogOut, Menu, Search, Store, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

const pageTitles = [
    { path: '/admin/products', title: 'San pham' },
    { path: '/admin/catalogs', title: 'Danh muc & Khoa' },
    { path: '/admin/blogs', title: 'Tin tức' },
    { path: '/admin/policies', title: 'Chinh sach' },
    { path: '/admin/promotions', title: 'Khuyen mai' },
    { path: '/admin/orders', title: 'Don hang' },
    { path: '/admin/users', title: 'Nguoi dung' },
    { path: '/admin/contacts', title: 'Lien he' },
    { path: '/admin/reviews', title: 'Danh gia' },
    { path: '/admin/site-content', title: 'Noi dung site' },
    { path: '/admin/chat-knowledge', title: 'Tai lieu AI' },
    { path: '/admin/chat-conversations', title: 'Hoi thoai AI' },
    { path: '/admin/analytics', title: 'Thong ke' },
];

export default function AdminTopbar({ onOpenSidebar }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const currentTitle = pageTitles.find((item) => location.pathname.startsWith(item.path))?.title || 'Dashboard';

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={onOpenSidebar}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    <Menu size={20} />
                </button>

                <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Admin / {currentTitle}</div>
                    <h2 className="truncate text-lg font-extrabold text-slate-900 dark:text-white">{currentTitle}</h2>
                </div>

                <div className="hidden h-10 w-72 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 lg:flex dark:border-slate-700 dark:bg-slate-950">
                    <Search size={17} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tim nhanh..."
                        className="w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400 dark:text-slate-200"
                    />
                </div>

                <Link
                    to="/"
                    className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:flex dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <Store size={17} />
                    Xem shop
                </Link>

                <div className="hidden items-center gap-3 md:flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        <UserRound size={19} />
                    </div>

                    <div className="max-w-[160px]">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {user?.name || user?.full_name || 'Quan tri CTUT Store'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Quan tri</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                    title="Dang xuat"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}
