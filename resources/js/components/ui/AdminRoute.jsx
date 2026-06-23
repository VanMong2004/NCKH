import { ShieldAlert } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

function checkIsAdmin(user) {
    if (!user) return false;

    if (user.role === 'admin') return true;
    if (user.role?.name === 'admin') return true;
    if (Array.isArray(user.roles) && user.roles.includes('admin')) return true;

    return false;
}

export default function AdminRoute({ children }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-950 dark:border-slate-700 dark:border-t-blue-400" />
                    <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Đang kiểm tra quyền quản trị...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!checkIsAdmin(user)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
                <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10">
                        <ShieldAlert size={32} />
                    </div>

                    <h1 className="mt-5 text-2xl font-black text-blue-950 dark:text-white">Không có quyền truy cập</h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Khu vực quản trị chỉ dành cho tài khoản admin.
                    </p>

                    <Link
                        to="/"
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-950 px-5 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return children;
}
