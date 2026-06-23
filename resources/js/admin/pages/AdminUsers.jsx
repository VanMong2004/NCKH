import { Eye, Loader2, RefreshCcw, Search, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import AdminUserDetailModal from '../components/users/AdminUserDetailModal';
import adminUserService from '../services/adminUserService';
import StatCard from '../components/ui/StatCard';

const roleOptions = [
    { value: '', label: 'Tất cả vai trò' },
    { value: 'user', label: 'Khách hàng' },
    { value: 'admin', label: 'Quản trị viên' },
];

const accountScopeOptions = [
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'with_deleted', label: 'Bao gồm đã khóa' },
];

const sortOptions = [
    { value: 'latest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
];

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        keyword: '',
        role: '',
        account_scope: 'active',
        sort: 'latest',
        page: 1,
        per_page: 10,
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
    });

    const [detailState, setDetailState] = useState({
        open: false,
        userId: null,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedKeyword, filters.role, filters.account_scope, filters.sort, filters.page, filters.per_page]);

    async function loadUsers() {
        try {
            setLoading(true);

            const result = await adminUserService.getUsers({
                keyword: debouncedKeyword || undefined,
                role: filters.role || undefined,
                sort: filters.sort || undefined,
                with_deleted: filters.account_scope === 'with_deleted' ? 1 : undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setUsers(result.users || []);
            setMeta(
                result.meta || {
                    currentPage: 1,
                    lastPage: 1,
                    perPage: filters.per_page,
                    total: 0,
                },
            );
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }

    function updateFilter(key, value) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? value : 1,
        }));
    }

    function resetFilters() {
        setFilters({
            keyword: '',
            role: '',
            account_scope: 'active',
            sort: 'latest',
            page: 1,
            per_page: 10,
        });

        setDebouncedKeyword('');
    }

    function openDetail(user) {
        setDetailState({
            open: true,
            userId: user.id,
        });
    }

    function closeDetail() {
        setDetailState({
            open: false,
            userId: null,
        });
    }

    async function handleUpdatedUser() {
        await loadUsers();
    }

    const summary = useMemo(() => {
        return {
            total: meta.total,
            customers: users.filter((item) => item.role === 'user').length,
            admins: users.filter((item) => item.role === 'admin').length,
            locked: users.filter((item) => item.isDeleted).length,
            orders: users.reduce((sum, item) => sum + Number(item.ordersCount || 0), 0),
        };
    }, [users, meta.total]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Người dùng</h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý khách hàng, tài khoản quản trị, đơn hàng và trạng thái tài khoản.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadUsers}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    Tải lại
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Tổng tài khoản" value={summary.total} tone="blue" />
                <StatCard label="Admin" value={summary.admins} tone="violet" />
                <StatCard label="Tổng đơn mua hàng" value={summary.orders} tone="rose" />
                <StatCard label="Người dùng" value={summary.normal} tone="emerald" />
                <StatCard label="Đã khóa" value={summary.locked} tone="slate" />
            </div>
            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 lg:grid-cols-12">
                        <div className="relative lg:col-span-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                value={filters.keyword}
                                onChange={(e) => updateFilter('keyword', e.target.value)}
                                placeholder="Tìm tên, email, SĐT, MSSV..."
                                className={controlClass + ' pl-9'}
                            />
                        </div>

                        <select
                            value={filters.role}
                            onChange={(e) => updateFilter('role', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {roleOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.account_scope}
                            onChange={(e) => updateFilter('account_scope', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {accountScopeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.sort}
                            onChange={(e) => updateFilter('sort', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 lg:col-span-2"
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Người dùng</Th>
                                <Th>Liên hệ</Th>
                                <Th>Vai trò</Th>
                                <Th className="text-center">Đơn hàng</Th>
                                <Th className="text-center">Đánh giá</Th>
                                <Th>Trạng thái</Th>
                                <Th>Ngày tạo</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Đang tải người dùng...</p>
                                    </td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatarUrl || '/images/no-image.png'}
                                                    alt={user.name}
                                                    className="h-11 w-11 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/images/no-image.png';
                                                    }}
                                                />

                                                <div className="min-w-0">
                                                    <p className="max-w-[220px] truncate font-semibold text-slate-900 dark:text-white">
                                                        {user.name || 'Người dùng'}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {user.mssv ? `MSSV: ${user.mssv}` : `ID: ${user.id}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="text-sm">
                                                <p className="text-slate-700 dark:text-slate-200">
                                                    {user.email || '—'}
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {user.phone || 'Chưa có SĐT'}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <RoleBadge role={user.role}>{user.roleText}</RoleBadge>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center font-semibold text-slate-700 dark:text-slate-200">
                                            {user.ordersCount || 0}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center font-semibold text-slate-700 dark:text-slate-200">
                                            {user.reviewsCount || 0}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <AccountStatusBadge locked={user.isDeleted} />
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                                            {user.createdAt || '—'}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => openDetail(user)}
                                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                <Eye size={15} />
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <UserRound size={30} className="mx-auto text-slate-300" />

                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                                            Không có người dùng phù hợp
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Thử đổi từ khóa hoặc đặt lại bộ lọc.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <p className="text-sm text-slate-500">
                        Hiển thị <b>{users.length}</b> / <b>{meta.total}</b> người dùng
                    </p>

                    <div className="flex items-center gap-2">
                        <select
                            value={filters.per_page}
                            onChange={(e) => updateFilter('per_page', Number(e.target.value))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                        </select>

                        <button
                            type="button"
                            disabled={meta.currentPage <= 1 || loading}
                            onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                            Trước
                        </button>

                        <span className="min-w-[80px] text-center text-sm text-slate-500">
                            {meta.currentPage}/{meta.lastPage}
                        </span>

                        <button
                            type="button"
                            disabled={meta.currentPage >= meta.lastPage || loading}
                            onClick={() => updateFilter('page', Math.min(meta.lastPage, filters.page + 1))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </section>

            <AdminUserDetailModal
                open={detailState.open}
                userId={detailState.userId}
                onClose={closeDetail}
                onUpdated={handleUpdatedUser}
            />
        </div>
    );
}

function Th({ children, className = '' }) {
    return (
        <th
            scope="col"
            className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}
        >
            {children}
        </th>
    );
}

function RoleBadge({ role, children }) {
    const isAdmin = role === 'admin';

    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                isAdmin
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
            ].join(' ')}
        >
            {isAdmin && <ShieldCheck size={13} />}
            {children}
        </span>
    );
}

function AccountStatusBadge({ locked }) {
    if (locked) {
        return (
            <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
                Đã khóa
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Hoạt động
        </span>
    );
}

const controlClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
