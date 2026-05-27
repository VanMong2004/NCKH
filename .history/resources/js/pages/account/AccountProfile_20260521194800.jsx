import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import ProfileForm from '../../components/account/ProfileForm';

export default function AccountProfile() {
    const { user } = useAuth();

    return (
        <div>
            <Breadcrumb />

            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Thông tin cá nhân</h1>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Quản lý thông tin tài khoản của bạn</p>
            </div>

            <ProfileForm user={user} />
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <span>Tài khoản</span>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Thông tin cá nhân</span>
        </div>
    );
}
