import { Eye, FileText, Loader2, Pencil, Plus, RefreshCcw, Star, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatCard from '../components/ui/StatCard';
import adminBlogService from '../services/adminBlogService';

const sortOptions = [
    { value: 'latest', label: 'Moi nhat' },
    { value: 'oldest', label: 'Cu nhat' },
    { value: 'published_desc', label: 'Ngay dang moi nhat' },
    { value: 'published_asc', label: 'Ngay dang cu nhat' },
];

const statusOptions = [
    { value: '', label: 'Tat ca' },
    { value: 'draft', label: 'Ban nhap' },
    { value: 'published', label: 'Da xuat ban' },
];

const featuredOptions = [
    { value: '', label: 'Tat ca noi bat' },
    { value: '1', label: 'Noi bat' },
    { value: '0', label: 'Thong thuong' },
];

const defaultFilters = {
    keyword: '',
    status: '',
    is_featured: '',
    sort: 'latest',
    page: 1,
    per_page: 10,
};

const defaultMeta = { currentPage: 1, lastPage: 1, total: 0, perPage: 10 };

export default function AdminBlogs() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(defaultFilters);
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [meta, setMeta] = useState(defaultMeta);
    const [modalState, setModalState] = useState({ open: false, mode: 'create', blog: null });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [statusTarget, setStatusTarget] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedKeyword(filters.keyword.trim()), 350);
        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadBlogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedKeyword, filters.status, filters.is_featured, filters.sort, filters.page, filters.per_page]);

    async function loadBlogs() {
        try {
            setLoading(true);

            const result = await adminBlogService.getBlogs({
                keyword: debouncedKeyword || undefined,
                status: filters.status || undefined,
                is_featured: filters.is_featured === '' ? undefined : Number(filters.is_featured),
                sort: filters.sort,
                page: filters.page,
                per_page: filters.per_page,
            });

            setBlogs(result.blogs || []);
            setMeta(result.meta || { ...defaultMeta, perPage: filters.per_page });
        } catch (error) {
            toast.error(error?.message || 'Khong the tai danh sach bai viet');
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
        setFilters(defaultFilters);
        setDebouncedKeyword('');
    }

    async function openDetail(blog) {
        try {
            const detail = await adminBlogService.getBlog(blog.id);
            setModalState({ open: true, mode: 'detail', blog: detail });
        } catch (error) {
            toast.error(error?.message || 'Khong the tai chi tiet bai viet');
        }
    }

    async function openEdit(blog) {
        try {
            const detail = await adminBlogService.getBlog(blog.id);
            setModalState({ open: true, mode: 'edit', blog: detail });
        } catch (error) {
            toast.error(error?.message || 'Khong the tai du lieu bai viet');
        }
    }

    async function handleSaved() {
        await loadBlogs();
    }

    async function handleDelete() {
        if (!deleteTarget) return;

        await adminBlogService.deleteBlog(deleteTarget.id);
        toast.success('Da xoa bai viet');
        setDeleteTarget(null);
        await loadBlogs();
    }

    async function handleStatusUpdate() {
        if (!statusTarget) return;

        await adminBlogService.updateStatus(statusTarget.id, statusTarget.nextStatus);
        toast.success(statusTarget.nextStatus === 'published' ? 'Da xuat ban bai viet' : 'Da chuyen ve ban nhap');
        setStatusTarget(null);
        await loadBlogs();
    }

    const summary = {
        total: meta.total,
        draft: blogs.filter((item) => item.status === 'draft').length,
        published: blogs.filter((item) => item.status === 'published').length,
        featured: blogs.filter((item) => item.isFeatured).length,
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blog</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quan ly bai viet tin tuc va huong dan hien thi o khu vuc nguoi dung.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={loadBlogs} disabled={loading} className={secondaryButtonClass}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                        Tai lai
                    </button>

                    <button
                        type="button"
                        onClick={() => setModalState({ open: true, mode: 'create', blog: null })}
                        className={primaryButtonClass}
                    >
                        <Plus size={16} />
                        Them bai viet
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tong bai viet" value={summary.total} tone="blue" icon={FileText} />
                <StatCard label="Ban nhap" value={summary.draft} tone="amber" />
                <StatCard label="Da xuat ban" value={summary.published} tone="emerald" />
                <StatCard label="Noi bat" value={summary.featured} tone="violet" icon={Star} />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 lg:grid-cols-12">
                        <input
                            value={filters.keyword}
                            onChange={(e) => updateFilter('keyword', e.target.value)}
                            placeholder="Tim theo tieu de, slug..."
                            className={controlClass + ' lg:col-span-5'}
                        />

                        <select
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.is_featured}
                            onChange={(e) => updateFilter('is_featured', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {featuredOptions.map((option) => (
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

                        <button type="button" onClick={resetFilters} className={'h-10 ' + secondaryOnlyClass + ' lg:col-span-1'}>
                            Reset
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Bai viet</Th>
                                <Th>Trang thai</Th>
                                <Th>Noi bat</Th>
                                <Th>Ngay dang</Th>
                                <Th>Nguoi tao</Th>
                                <Th>Cap nhat</Th>
                                <Th className="text-right">Thao tac</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Dang tai bai viet...</p>
                                    </td>
                                </tr>
                            ) : blogs.length > 0 ? (
                                blogs.map((blog) => (
                                    <tr key={blog.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                        <Td>
                                            <div className="flex items-center gap-3">
                                                <div className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                                    {blog.thumbnail ? (
                                                        <img src={blog.thumbnail} alt={blog.title} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                            <FileText size={20} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="max-w-[280px] line-clamp-2 font-semibold text-slate-900 dark:text-white">
                                                        {blog.title}
                                                    </p>
                                                    <p className="mt-1 max-w-[280px] line-clamp-2 text-xs text-slate-500">
                                                        {blog.summary || 'Chua co mo ta ngan'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">{blog.slug}</p>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <StatusBadge status={blog.status} />
                                        </Td>
                                        <Td>
                                            <span className={blog.isFeatured ? featuredBadgeClass : defaultBadgeClass}>
                                                {blog.isFeatured ? 'Noi bat' : 'Thong thuong'}
                                            </span>
                                        </Td>
                                        <Td>{blog.publishedAtDisplay || 'Chua xuat ban'}</Td>
                                        <Td>{blog.authorName || 'Quan tri CTUT Store'}</Td>
                                        <Td>{blog.updatedAt || '-'}</Td>
                                        <Td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => openDetail(blog)} className={smallButtonClass}>
                                                    <Eye size={15} /> Xem
                                                </button>
                                                <button type="button" onClick={() => openEdit(blog)} className={smallButtonClass}>
                                                    <Pencil size={15} /> Sua
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setStatusTarget({
                                                            ...blog,
                                                            nextStatus: blog.status === 'published' ? 'draft' : 'published',
                                                        })
                                                    }
                                                    className={smallButtonClass}
                                                >
                                                    {blog.status === 'published' ? 'An' : 'Xuat ban'}
                                                </button>
                                                <button type="button" onClick={() => setDeleteTarget(blog)} className={dangerButtonClass}>
                                                    <Trash2 size={15} /> Xoa
                                                </button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <FileText size={30} className="mx-auto text-slate-300" />
                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">Chua co bai viet nao</p>
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
                    showing={blogs.length}
                />
            </section>

            <BlogModal
                open={modalState.open}
                mode={modalState.mode}
                blog={modalState.blog}
                onClose={() => setModalState({ open: false, mode: 'create', blog: null })}
                onSaved={handleSaved}
            />

            <ConfirmDialog
                open={Boolean(statusTarget)}
                onOpenChange={(open) => !open && setStatusTarget(null)}
                title={statusTarget?.nextStatus === 'published' ? 'Xuat ban bai viet' : 'Chuyen ve ban nhap'}
                message={`Ban muon ${statusTarget?.nextStatus === 'published' ? 'xuat ban' : 'an'} bai viet "${statusTarget?.title || ''}"?`}
                description="Bai viet o trang thai ban nhap se khong hien thi o giao dien nguoi dung."
                confirmText={statusTarget?.nextStatus === 'published' ? 'Xuat ban' : 'Chuyen ve ban nhap'}
                type="warning"
                onConfirm={handleStatusUpdate}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Xoa bai viet"
                message={`Ban muon xoa bai viet "${deleteTarget?.title || ''}"?`}
                description="Du lieu se duoc xoa mem de tranh anh huong du lieu cu."
                confirmText="Xoa bai viet"
                type="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
}

function BlogModal({ open, mode, blog, onClose, onSaved }) {
    const [form, setForm] = useState({
        title: '',
        summary: '',
        content: '',
        thumbnail: '',
        status: 'draft',
        is_featured: false,
        published_at: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;

        setForm({
            title: blog?.title || '',
            summary: blog?.summary || '',
            content: blog?.content || '',
            thumbnail: blog?.thumbnail || '',
            status: blog?.status || 'draft',
            is_featured: blog?.isFeatured ?? false,
            published_at: blog?.publishedAt || '',
        });
    }, [open, blog]);

    if (!open) return null;

    const readOnly = mode === 'detail';
    const title = mode === 'create' ? 'Them bai viet' : mode === 'edit' ? 'Cap nhat bai viet' : 'Chi tiet bai viet';

    async function handleSubmit(e) {
        e.preventDefault();
        if (readOnly) return;

        try {
            setSaving(true);

            const payload = {
                title: form.title,
                summary: form.summary || undefined,
                content: form.content,
                thumbnail: form.thumbnail || undefined,
                status: form.status,
                is_featured: Boolean(form.is_featured),
                published_at: form.published_at || undefined,
            };

            if (mode === 'create') {
                await adminBlogService.createBlog(payload);
                toast.success('Da tao bai viet');
            } else {
                await adminBlogService.updateBlog(blog.id, payload);
                toast.success('Da cap nhat bai viet');
            }

            onClose();
            await onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Khong the luu bai viet');
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
            <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {readOnly ? 'Xem noi dung bai viet dang luu trong he thong.' : 'Dien day du thong tin bai viet tin tuc.'}
                        </p>
                    </div>

                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="max-h-[calc(92vh-74px)] space-y-4 overflow-y-auto p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tieu de bai viet">
                            <input
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className={controlClass}
                                disabled={readOnly}
                            />
                        </Field>

                        <Field label="Trang thai">
                            <select
                                value={form.status}
                                onChange={(e) => updateField('status', e.target.value)}
                                className={controlClass}
                                disabled={readOnly}
                            >
                                <option value="draft">Ban nhap</option>
                                <option value="published">Da xuat ban</option>
                            </select>
                        </Field>

                        <Field label="Anh dai dien">
                            <input
                                value={form.thumbnail}
                                onChange={(e) => updateField('thumbnail', e.target.value)}
                                className={controlClass}
                                placeholder="Nhap URL hoac duong dan anh"
                                disabled={readOnly}
                            />
                        </Field>

                        <Field label="Ngay gio dang bai">
                            <input
                                type="datetime-local"
                                value={form.published_at}
                                onChange={(e) => updateField('published_at', e.target.value)}
                                className={controlClass}
                                disabled={readOnly}
                            />
                        </Field>
                    </div>

                    <Field label="Mo ta ngan">
                        <textarea
                            rows={4}
                            value={form.summary}
                            onChange={(e) => updateField('summary', e.target.value)}
                            className={textareaClass}
                            disabled={readOnly}
                        />
                    </Field>

                    <Field label="Noi dung bai viet">
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
                            checked={Boolean(form.is_featured)}
                            onChange={(e) => updateField('is_featured', e.target.checked)}
                            disabled={readOnly}
                        />
                        Danh dau bai viet noi bat
                    </label>

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <button type="button" onClick={onClose} className={secondaryOnlyClass}>
                            {readOnly ? 'Dong' : 'Huy'}
                        </button>

                        {!readOnly && (
                            <button type="submit" disabled={saving} className={primaryButtonClass}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <SaveIcon />}
                                {mode === 'create' ? 'Tao bai viet' : 'Luu thay doi'}
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
                Hien thi <b>{showing}</b> / <b>{meta.total}</b> bai viet
            </p>

            <div className="flex items-center gap-2">
                <select value={perPage} onChange={(e) => onPerPage(Number(e.target.value))} className={compactControlClass}>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                </select>

                <button
                    type="button"
                    disabled={meta.currentPage <= 1 || loading}
                    onClick={() => onPage(Math.max(1, meta.currentPage - 1))}
                    className={pagerButtonClass}
                >
                    Truoc
                </button>

                <span className="min-w-[80px] text-center text-sm text-slate-500">
                    {meta.currentPage}/{meta.lastPage}
                </span>

                <button
                    type="button"
                    disabled={meta.currentPage >= meta.lastPage || loading}
                    onClick={() => onPage(Math.min(meta.lastPage, meta.currentPage + 1))}
                    className={pagerButtonClass}
                >
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

function StatusBadge({ status }) {
    return (
        <span className={status === 'published' ? publishedBadgeClass : draftBadgeClass}>
            {status === 'published' ? 'Da xuat ban' : 'Ban nhap'}
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
const publishedBadgeClass =
    'inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
const draftBadgeClass =
    'inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
const featuredBadgeClass =
    'inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300';
const defaultBadgeClass =
    'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300';
