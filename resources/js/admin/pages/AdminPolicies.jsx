import { Eye, FileText, Loader2, Pencil, Plus, Power, RefreshCcw, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatCard from '../components/ui/StatCard';
import adminPolicyService from '../services/adminPolicyService';

const sortOptions = [
    { value: 'latest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
];

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: '1', label: 'Đang hiển thị' },
    { value: '0', label: 'Đang tắt' },
];

export default function AdminPolicies() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        keyword: '',
        type: '',
        is_active: '',
        sort: 'latest',
        page: 1,
        per_page: 10,
    });
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 10 });
    const [modalState, setModalState] = useState({ open: false, mode: 'create', policy: null });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [toggleTarget, setToggleTarget] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedKeyword(filters.keyword.trim()), 350);
        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadPolicies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedKeyword, filters.type, filters.is_active, filters.sort, filters.page, filters.per_page]);

    async function loadPolicies() {
        try {
            setLoading(true);
            const result = await adminPolicyService.getPolicies({
                keyword: debouncedKeyword || undefined,
                type: filters.type || undefined,
                is_active: filters.is_active === '' ? undefined : Number(filters.is_active),
                sort: filters.sort,
                page: filters.page,
                per_page: filters.per_page,
            });

            setPolicies(result.policies || []);
            setMeta(result.meta || { currentPage: 1, lastPage: 1, total: 0, perPage: filters.per_page });
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách chính sách');
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
            type: '',
            is_active: '',
            sort: 'latest',
            page: 1,
            per_page: 10,
        });
        setDebouncedKeyword('');
    }

    async function openDetail(policy) {
        try {
            const detail = await adminPolicyService.getPolicy(policy.id);
            setModalState({ open: true, mode: 'detail', policy: detail });
        } catch (error) {
            toast.error(error?.message || 'Không thể tải chi tiết chính sách');
        }
    }

    async function openEdit(policy) {
        try {
            const detail = await adminPolicyService.getPolicy(policy.id);
            setModalState({ open: true, mode: 'edit', policy: detail });
        } catch (error) {
            toast.error(error?.message || 'Không thể tải dữ liệu chính sách');
        }
    }

    async function handleSaved() {
        await loadPolicies();
    }

    async function handleDelete() {
        if (!deleteTarget) return;

        await adminPolicyService.deletePolicy(deleteTarget.id);
        toast.success('Đã xóa chính sách');
        setDeleteTarget(null);
        await loadPolicies();
    }

    async function handleToggle() {
        if (!toggleTarget) return;

        await adminPolicyService.toggleActive(toggleTarget.id);
        toast.success(toggleTarget.isActive ? 'Đã tắt chính sách' : 'Đã bật chính sách');
        setToggleTarget(null);
        await loadPolicies();
    }

    const summary = {
        total: meta.total,
        active: policies.filter((item) => item.isActive).length,
        inactive: policies.filter((item) => !item.isActive).length,
        types: new Set(policies.map((item) => item.type).filter(Boolean)).size,
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chính sách</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý nội dung chính sách hiển thị ở khu vực người dùng.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={loadPolicies} disabled={loading} className={secondaryButtonClass}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                        Tải lại
                    </button>

                    <button
                        type="button"
                        onClick={() => setModalState({ open: true, mode: 'create', policy: null })}
                        className={primaryButtonClass}
                    >
                        <Plus size={16} />
                        Thêm chính sách
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng chính sách" value={summary.total} tone="blue" icon={FileText} />
                <StatCard label="Đang hiển thị" value={summary.active} tone="emerald" />
                <StatCard label="Đang tắt" value={summary.inactive} tone="amber" />
                <StatCard label="Loại chính sách" value={summary.types} tone="violet" />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 lg:grid-cols-12">
                        <div className="relative lg:col-span-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={filters.keyword}
                                onChange={(e) => updateFilter('keyword', e.target.value)}
                                placeholder="Tìm tiêu đề, slug, loại..."
                                className={controlClass + ' pl-9'}
                            />
                        </div>

                        <input
                            value={filters.type}
                            onChange={(e) => updateFilter('type', e.target.value)}
                            placeholder="Loại chính sách"
                            className={controlClass + ' lg:col-span-2'}
                        />

                        <select
                            value={filters.is_active}
                            onChange={(e) => updateFilter('is_active', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
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

                        <button type="button" onClick={resetFilters} className={'h-10 ' + secondaryOnlyClass + ' lg:col-span-2'}>
                            Đặt lại bộ lọc
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Tiêu đề</Th>
                                <Th>Slug</Th>
                                <Th>Loại</Th>
                                <Th>Trạng thái</Th>
                                <Th>Thứ tự</Th>
                                <Th>Cập nhật</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Đang tải chính sách...</p>
                                    </td>
                                </tr>
                            ) : policies.length > 0 ? (
                                policies.map((policy) => (
                                    <tr key={policy.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                        <Td>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{policy.title}</p>
                                                <p className="mt-1 line-clamp-2 max-w-[320px] text-xs text-slate-500">
                                                    {policy.contentPreview || 'Chưa có mô tả ngắn'}
                                                </p>
                                            </div>
                                        </Td>
                                        <Td>{policy.slug}</Td>
                                        <Td>{policy.type || 'policy'}</Td>
                                        <Td>
                                            <StatusBadge active={policy.isActive} />
                                        </Td>
                                        <Td>{policy.sortOrder}</Td>
                                        <Td>{policy.updatedAt || '—'}</Td>
                                        <Td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => openDetail(policy)} className={smallButtonClass}>
                                                    <Eye size={15} /> Xem
                                                </button>
                                                <button type="button" onClick={() => openEdit(policy)} className={smallButtonClass}>
                                                    <Pencil size={15} /> Sửa
                                                </button>
                                                <button type="button" onClick={() => setToggleTarget(policy)} className={smallButtonClass}>
                                                    <Power size={15} /> {policy.isActive ? 'Tắt' : 'Bật'}
                                                </button>
                                                <button type="button" onClick={() => setDeleteTarget(policy)} className={dangerButtonClass}>
                                                    <Trash2 size={15} /> Xóa
                                                </button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <FileText size={30} className="mx-auto text-slate-300" />
                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                                            Chưa có chính sách nào
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    meta={meta}
                    loading={loading}
                    perPage={filters.per_page}
                    onPage={(page) => updateFilter('page', page)}
                    onPerPage={(value) => updateFilter('per_page', value)}
                    showing={policies.length}
                />
            </section>

            <PolicyModal
                open={modalState.open}
                mode={modalState.mode}
                policy={modalState.policy}
                onClose={() => setModalState({ open: false, mode: 'create', policy: null })}
                onSaved={handleSaved}
            />

            <ConfirmDialog
                open={Boolean(toggleTarget)}
                onOpenChange={(open) => !open && setToggleTarget(null)}
                title={toggleTarget?.isActive ? 'Tắt chính sách' : 'Bật chính sách'}
                message={`Bạn muốn ${toggleTarget?.isActive ? 'tắt' : 'bật'} chính sách "${toggleTarget?.title || ''}"?`}
                description="Chính sách bị tắt sẽ không hiển thị ở giao diện người dùng."
                confirmText={toggleTarget?.isActive ? 'Tắt chính sách' : 'Bật chính sách'}
                type="warning"
                onConfirm={handleToggle}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Xóa chính sách"
                message={`Bạn muốn xóa chính sách "${deleteTarget?.title || ''}"?`}
                description="Dữ liệu sẽ được xóa mềm để tránh ảnh hưởng dữ liệu cũ."
                confirmText="Xóa chính sách"
                type="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
}

function PolicyModal({ open, mode, policy, onClose, onSaved }) {
    const [form, setForm] = useState({
        title: '',
        slug: '',
        type: 'policy',
        content: '',
        sort_order: 0,
        is_active: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;

        setForm({
            title: policy?.title || '',
            slug: policy?.slug || '',
            type: policy?.type || 'policy',
            content: policy?.content || '',
            sort_order: policy?.sortOrder || 0,
            is_active: policy?.isActive ?? true,
        });
    }, [open, policy]);

    if (!open) return null;

    const readOnly = mode === 'detail';
    const title =
        mode === 'create' ? 'Thêm chính sách' : mode === 'edit' ? 'Cập nhật chính sách' : 'Chi tiết chính sách';

    async function handleSubmit(e) {
        e.preventDefault();
        if (readOnly) return;

        try {
            setSaving(true);

            const payload = {
                title: form.title,
                slug: form.slug || undefined,
                type: form.type,
                content: form.content,
                sort_order: Number(form.sort_order || 0),
                is_active: Boolean(form.is_active),
            };

            if (mode === 'create') {
                await adminPolicyService.createPolicy(payload);
                toast.success('Đã tạo chính sách');
            } else {
                await adminPolicyService.updatePolicy(policy.id, payload);
                toast.success('Đã cập nhật chính sách');
            }

            onClose();
            await onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu chính sách');
        } finally {
            setSaving(false);
        }
    }

    function updateField(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-3">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {readOnly ? 'Xem nội dung chính sách đang lưu trong hệ thống.' : 'Điền đầy đủ thông tin chính sách.'}
                        </p>
                    </div>

                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tiêu đề">
                            <input
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className={controlClass}
                                disabled={readOnly}
                            />
                        </Field>

                        <Field label="Slug">
                            <input
                                value={form.slug}
                                onChange={(e) => updateField('slug', e.target.value)}
                                className={controlClass}
                                placeholder="Để trống để hệ thống tự tạo"
                                disabled={readOnly}
                            />
                        </Field>

                        <Field label="Loại chính sách">
                            <input
                                value={form.type}
                                onChange={(e) => updateField('type', e.target.value)}
                                className={controlClass}
                                placeholder="Ví dụ: policy, terms, privacy"
                                disabled={readOnly}
                            />
                        </Field>

                        <Field label="Thứ tự sắp xếp">
                            <input
                                type="number"
                                min={0}
                                value={form.sort_order}
                                onChange={(e) => updateField('sort_order', e.target.value)}
                                className={controlClass}
                                disabled={readOnly}
                            />
                        </Field>
                    </div>

                    <Field label="Nội dung chính sách">
                        <textarea
                            rows={16}
                            value={form.content}
                            onChange={(e) => updateField('content', e.target.value)}
                            className={textareaClass}
                            disabled={readOnly}
                        />
                    </Field>

                    <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={Boolean(form.is_active)}
                            onChange={(e) => updateField('is_active', e.target.checked)}
                            disabled={readOnly}
                        />
                        Hiển thị chính sách ở giao diện người dùng
                    </label>

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <button type="button" onClick={onClose} className={secondaryOnlyClass}>
                            {readOnly ? 'Đóng' : 'Hủy'}
                        </button>

                        {!readOnly && (
                            <button type="submit" disabled={saving} className={primaryButtonClass}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <SaveIcon />}
                                {mode === 'create' ? 'Tạo chính sách' : 'Lưu thay đổi'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

function Pagination({ meta, loading, perPage, onPage, onPerPage, showing }) {
    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <p className="text-sm text-slate-500">
                Hiển thị <b>{showing}</b> / <b>{meta.total}</b> chính sách
            </p>

            <div className="flex items-center gap-2">
                <select value={perPage} onChange={(e) => onPerPage(Number(e.target.value))} className={compactControlClass}>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                </select>

                <button type="button" disabled={meta.currentPage <= 1 || loading} onClick={() => onPage(Math.max(1, meta.currentPage - 1))} className={pagerButtonClass}>
                    Trước
                </button>

                <span className="min-w-[80px] text-center text-sm text-slate-500">
                    {meta.currentPage}/{meta.lastPage}
                </span>

                <button type="button" disabled={meta.currentPage >= meta.lastPage || loading} onClick={() => onPage(Math.min(meta.lastPage, meta.currentPage + 1))} className={pagerButtonClass}>
                    Sau
                </button>
            </div>
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

function Td({ children, className = '' }) {
    return <td className={`whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300 ${className}`}>{children}</td>;
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
            {children}
        </label>
    );
}

function StatusBadge({ active }) {
    return (
        <span
            className={[
                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
            ].join(' ')}
        >
            {active ? 'Đang hiển thị' : 'Đang tắt'}
        </span>
    );
}

function SaveIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
            <path d="M17 21v-8H7v8" />
            <path d="M7 3v5h8" />
        </svg>
    );
}

const controlClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const compactControlClass =
    'h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const textareaClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const primaryButtonClass =
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200';
const secondaryOnlyClass =
    'rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800';
const secondaryButtonClass = `inline-flex h-10 items-center justify-center gap-2 ${secondaryOnlyClass}`;
const smallButtonClass =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800';
const dangerButtonClass =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10';
const pagerButtonClass =
    'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200';
