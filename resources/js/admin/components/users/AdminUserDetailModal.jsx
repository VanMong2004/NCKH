import { Lock, Loader2, MapPin, Package, RotateCcw, Save, ShieldCheck, Star, Trash2, Undo2, Unlock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../ui/ConfirmDialog';
import { formatMoney, getOrderStatusText, getUserRoleText } from '../../mappers/adminUserMapper';
import adminUserService from '../../services/adminUserService';

export default function AdminUserDetailModal({ open, userId, onClose, onUpdated }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const [role, setRole] = useState('user');
    const [savingRole, setSavingRole] = useState(false);
    const [locking, setLocking] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
    });

    useEffect(() => {
        if (!open || !userId) return;

        loadUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, userId]);

    async function loadUser() {
        try {
            setLoading(true);

            const result = await adminUserService.getUser(userId);

            setUser(result);
            setRole(result.role || 'user');
        } catch (error) {
            toast.error(error?.message || 'Không thể tải chi tiết người dùng');
            onClose?.();
        } finally {
            setLoading(false);
        }
    }

    function handleUpdateRole(e) {
        e.preventDefault();

        if (!user) return;

        if (role === user.role) {
            toast.info('Vai trò chưa thay đổi');
            return;
        }

        const isMakeAdmin = role === 'admin';

        setConfirmDialog({
            open: true,
            title: isMakeAdmin ? 'Cấp quyền quản trị' : 'Chuyển về khách hàng',
            message: isMakeAdmin
                ? `Bạn muốn cấp quyền quản trị cho "${user.name}"?`
                : `Bạn muốn chuyển "${user.name}" về vai trò khách hàng?`,
            description: isMakeAdmin
                ? 'Người này có thể truy cập khu vực admin và thực hiện các thao tác quản trị.'
                : 'Người này sẽ không còn quyền truy cập khu vực quản trị.',
            confirmText: isMakeAdmin ? 'Cấp quyền admin' : 'Cập nhật vai trò',
            type: isMakeAdmin ? 'warning' : 'info',
            onConfirm: updateRole,
        });
    }

    async function updateRole() {
        if (!user) return;

        try {
            setSavingRole(true);

            const result = await adminUserService.updateRole(user.id, role);

            setUser(result);
            setRole(result.role || role);

            toast.success('Đã cập nhật vai trò');
            onUpdated?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể cập nhật vai trò');
        } finally {
            setSavingRole(false);
        }
    }

    function handleLock() {
        if (!user) return;

        setConfirmDialog({
            open: true,
            title: 'Khóa tài khoản',
            message: `Bạn muốn khóa tài khoản "${user.name}"?`,
            description: 'Người này sẽ không còn hoạt động như tài khoản bình thường cho đến khi được mở lại.',
            confirmText: 'Khóa tài khoản',
            type: 'danger',
            onConfirm: lockUser,
        });
    }

    async function lockUser() {
        if (!user) return;

        try {
            setLocking(true);

            const result = await adminUserService.lockUser(user.id);

            toast.success(result.message || 'Đã khóa tài khoản');

            await loadUser();
            onUpdated?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể khóa tài khoản');
        } finally {
            setLocking(false);
        }
    }

    function handleRestore() {
        if (!user) return;

        setConfirmDialog({
            open: true,
            title: 'Mở khóa tài khoản',
            message: `Bạn muốn mở khóa tài khoản "${user.name}"?`,
            description: 'Sau khi mở khóa, tài khoản có thể hoạt động lại bình thường.',
            confirmText: 'Mở khóa',
            type: 'success',
            onConfirm: unlockUser,
        });
    }

    async function unlockUser() {
        if (!user) return;

        try {
            setLocking(true);

            const result = await adminUserService.unlockUser(user.id);

            setUser(result);
            setRole(result.role || role);

            toast.success('Đã mở khóa tài khoản');
            onUpdated?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể mở khóa tài khoản');
        } finally {
            setLocking(false);
        }
    }

    function handleDelete() {
        if (!user) return;

        setConfirmDialog({
            open: true,
            title: 'Xóa tài khoản',
            message: `Bạn muốn xóa tài khoản "${user.name}"?`,
            description: 'Tài khoản sẽ bị xóa mềm khỏi hệ thống. Bạn vẫn có thể khôi phục lại sau.',
            confirmText: 'Xóa tài khoản',
            type: 'danger',
            onConfirm: deleteUser,
        });
    }

    async function deleteUser() {
        if (!user) return;

        try {
            setDeleting(true);

            const result = await adminUserService.deleteUser(user.id);

            toast.success(result.message || 'Đã xóa tài khoản');

            onUpdated?.();

            onClose();
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa tài khoản');
        } finally {
            setDeleting(false);
        }
    }

    function handleRestoreDeleted() {
        if (!user) return;

        setConfirmDialog({
            open: true,
            title: 'Khôi phục tài khoản',
            message: `Bạn muốn khôi phục tài khoản "${user.name}"?`,
            description: 'Sau khi khôi phục, tài khoản sẽ quay lại danh sách người dùng và có thể sử dụng bình thường nếu không bị khóa.',
            confirmText: 'Khôi phục',
            type: 'success',
            onConfirm: restoreDeletedUser,
        });
    }

    async function restoreDeletedUser() {
        if (!user) return;

        try {
            setRestoring(true);

            const result = await adminUserService.restoreUser(user.id);

            setUser(result);
            setRole(result.role || role);

            toast.success('Đã khôi phục tài khoản');
            onUpdated?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể khôi phục tài khoản');
        } finally {
            setRestoring(false);
        }
    }

    if (!open) return null;

    const addresses = user?.addresses || [];
    const recentOrders = user?.recentOrders || [];

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-3">
            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết người dùng</h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Xem hồ sơ, địa chỉ, đơn hàng gần đây và quyền tài khoản.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading || !user ? (
                    <div className="flex min-h-[520px] items-center justify-center">
                        <div className="text-center">
                            <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
                            <p className="mt-3 text-sm text-slate-500">Đang tải chi tiết người dùng...</p>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                            <div className="space-y-5">
                                <Section title="Thông tin khách hàng">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <img
                                            src={user.avatarUrl || '/images/no-image.png'}
                                            alt={user.name}
                                            className="h-20 w-20 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/no-image.png';
                                            }}
                                        />

                                        <div className="min-w-0">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                {user.name || 'Người dùng'}
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">{user.email || '—'}</p>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <RoleBadge role={user.role}>{user.roleText}</RoleBadge>
                                                <AccountStatusBadge locked={user.isLocked} deleted={user.isDeleted} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <InfoLine label="ID" value={user.id} />
                                        <InfoLine label="MSSV" value={user.mssv || '—'} />
                                        <InfoLine label="Email" value={user.email || '—'} />
                                        <InfoLine label="Số điện thoại" value={user.phone || '—'} />
                                        <InfoLine label="Ngày tạo" value={user.createdAt || '—'} />
                                        <InfoLine
                                            label="Trạng thái"
                                            value={user.isDeleted ? 'Đã xóa' : user.isLocked ? 'Đã khóa' : 'Hoạt động'}
                                        />
                                    </div>
                                </Section>

                                <Section title="Địa chỉ nhận hàng" description={`${addresses.length} địa chỉ`}>
                                    {addresses.length > 0 ? (
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {addresses.map((address) => (
                                                <AddressCard key={address.id} address={address} />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon={<MapPin size={26} />}
                                            title="Chưa có địa chỉ"
                                            description="Người dùng chưa thêm địa chỉ nhận hàng."
                                        />
                                    )}
                                </Section>

                                <Section
                                    title="Đơn hàng gần đây"
                                    description={`${recentOrders.length} đơn hàng gần nhất`}
                                >
                                    {recentOrders.length > 0 ? (
                                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                                <thead className="bg-slate-50 dark:bg-slate-950/60">
                                                    <tr>
                                                        <Th>Mã đơn</Th>
                                                        <Th>Trạng thái</Th>
                                                        <Th>Tổng tiền</Th>
                                                        <Th>Ngày đặt</Th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {recentOrders.map((order) => (
                                                        <tr key={order.id}>
                                                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                                {order.orderCode || `#${order.id}`}
                                                            </td>

                                                            <td className="whitespace-nowrap px-4 py-3">
                                                                <OrderStatusBadge status={order.status}>
                                                                    {getOrderStatusText(order.status)}
                                                                </OrderStatusBadge>
                                                            </td>

                                                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                                {formatMoney(order.total)}
                                                            </td>

                                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                                                {order.createdAt || '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon={<Package size={26} />}
                                            title="Chưa có đơn hàng"
                                            description="Người dùng chưa phát sinh đơn hàng."
                                        />
                                    )}
                                </Section>
                            </div>

                            <aside className="space-y-5">
                                <Section title="Thống kê">
                                    <div className="grid gap-3">
                                        <StatLine
                                            icon={<Package size={17} />}
                                            label="Tổng đơn hàng"
                                            value={user.ordersCount || 0}
                                        />

                                        <StatLine
                                            icon={<Star size={17} />}
                                            label="Đánh giá đã viết"
                                            value={user.reviewsCount || 0}
                                        />

                                        <StatLine
                                            icon={<ShieldCheck size={17} />}
                                            label="Vai trò"
                                            value={getUserRoleText(user.role)}
                                        />
                                    </div>
                                </Section>

                                <Section title="Quyền tài khoản">
                                    <form onSubmit={handleUpdateRole} className="space-y-4">
                                        <Field label="Vai trò">
                                            <select
                                                value={role}
                                                disabled={user.isLocked || user.isDeleted || savingRole}
                                                onChange={(e) => setRole(e.target.value)}
                                                className={controlClass}
                                            >
                                                <option value="user">Khách hàng</option>
                                                <option value="admin">Quản trị viên</option>
                                            </select>
                                        </Field>

                                        <button
                                            type="submit"
                                            disabled={user.isLocked || user.isDeleted || savingRole || role === user.role}
                                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                        >
                                            {savingRole ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Save size={16} />
                                            )}
                                            Lưu vai trò
                                        </button>
                                    </form>

                                    {role === 'admin' && (
                                        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                                            Quản trị viên có thể truy cập khu vực admin. Chỉ cấp quyền này cho người tin cậy.
                                        </div>
                                    )}
                                </Section>

                                <Section title="Trạng thái tài khoản">
                                    {user.isDeleted ? (
                                        <>
                                            <button
                                                type="button"
                                                disabled={restoring}
                                                onClick={handleRestoreDeleted}
                                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-500/20 dark:bg-slate-950 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                            >
                                                {restoring ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Undo2 size={16} />
                                                )}
                                                Khôi phục tài khoản
                                            </button>

                                            <p className="mt-3 text-sm text-slate-500">
                                                Tài khoản đã bị xóa. Không thể khóa hoặc mở khóa cho đến khi được khôi phục.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            {user.isLocked ? (
                                                <button
                                                    type="button"
                                                    disabled={locking}
                                                    onClick={handleRestore}
                                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-500/20 dark:bg-slate-950 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                                >
                                                    {locking ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Unlock size={16} />
                                                    )}
                                                    Mở khóa tài khoản
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={locking}
                                                    onClick={handleLock}
                                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10"
                                                >
                                                    {locking ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Lock size={16} />
                                                    )}
                                                    Khóa tài khoản
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                disabled={deleting}
                                                onClick={handleDelete}
                                                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                            >
                                                {deleting ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                                Xóa tài khoản
                                            </button>

                                            <p className="mt-3 text-sm text-slate-500">
                                                Khóa tài khoản sẽ tạm ngưng đăng nhập. Xóa tài khoản sẽ đưa vào trạng thái đã xóa và có thể khôi phục sau.
                                            </p>
                                        </>
                                    )}
                                </Section>

                                <button
                                    type="button"
                                    onClick={loadUser}
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <RotateCcw size={16} />
                                    Tải lại chi tiết
                                </button>
                            </aside>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                description={confirmDialog.description}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onOpenChange={(open) => {
                    setConfirmDialog((prev) => ({
                        ...prev,
                        open,
                    }));
                }}
            />
        </div>
    );
}

function Section({ title, description, children }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>

            <div className="p-4">{children}</div>
        </section>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
            {children}
        </label>
    );
}

function InfoLine({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}

function StatLine({ icon, label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500">
                {icon}
                <span className="text-sm">{label}</span>
            </div>

            <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
        </div>
    );
}

function AddressCard({ address }) {
    return (
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{address.name || 'Người nhận'}</p>

                    <p className="mt-1 text-sm text-slate-500">{address.phone || 'Chưa có SĐT'}</p>
                </div>

                {address.isDefault && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        Mặc định
                    </span>
                )}
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {address.address || 'Chưa có địa chỉ'}
            </p>
        </div>
    );
}

function EmptyState({ icon, title, description }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                {icon}
            </div>

            <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
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

function AccountStatusBadge({ locked, deleted }) {
    if (deleted) {
        return (
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Đã xóa
            </span>
        );
    }

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

function OrderStatusBadge({ status, children }) {
    const key = String(status || '').toLowerCase();

    const className =
        key === 'completed'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : key === 'cancelled'
              ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
              : key === 'processing' || key === 'awaiting_receipt'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>
    );
}

const controlClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-800';
