import { Eye, FileText, ImagePlus, Loader2, Pencil, Plus, RefreshCcw, Star, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatCard from '../components/ui/StatCard';
import adminBlogService from '../services/adminBlogService';

const sortOptions = [
    { value: 'latest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'published_desc', label: 'Ngày đăng mới nhất' },
    { value: 'published_asc', label: 'Ngày đăng cũ nhất' },
];

const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'published', label: 'Đã xuất bản' },
];

const featuredOptions = [
    { value: '', label: 'Tất cả nổi bật' },
    { value: '1', label: 'Nổi bật' },
    { value: '0', label: 'Thông thường' },
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
            toast.error(error?.message || 'Không thể tải danh sách bài viết');
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
            toast.error(error?.message || 'Không thể tải chi tiết bài viết');
        }
    }

    async function openEdit(blog) {
        try {
            const detail = await adminBlogService.getBlog(blog.id);
            setModalState({ open: true, mode: 'edit', blog: detail });
        } catch (error) {
            toast.error(error?.message || 'Không thể tải dữ liệu bài viết');
        }
    }

    async function handleSaved() {
        await loadBlogs();
    }

    async function handleDelete() {
        if (!deleteTarget) return;

        if (deleteTarget.status === 'published') {
            toast.error('Không thể xóa bài viết đang xuất bản. Vui lòng chuyển về bản nháp trước khi xóa.');
            setDeleteTarget(null);
            return;
        }

        await adminBlogService.deleteBlog(deleteTarget.id);
        toast.success('Đã xóa bài viết');
        setDeleteTarget(null);
        await loadBlogs();
    }

    async function handleStatusUpdate() {
        if (!statusTarget) return;

        await adminBlogService.updateStatus(statusTarget.id, statusTarget.nextStatus);
        toast.success(statusTarget.nextStatus === 'published' ? 'Đã xuất bản bài viết' : 'Đã chuyển về bản nháp');
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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tin tức</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý bài viết tin tức và hướng dẫn hiển thị ở khu vực người dùng.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={loadBlogs} disabled={loading} className={secondaryButtonClass}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                        Tải lại
                    </button>

                    <button
                        type="button"
                        onClick={() => setModalState({ open: true, mode: 'create', blog: null })}
                        className={primaryButtonClass}
                    >
                        <Plus size={16} />
                        Thêm bài viết
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng bài viết" value={summary.total} tone="blue" icon={FileText} />
                <StatCard label="Bản nháp" value={summary.draft} tone="amber" />
                <StatCard label="Đã xuất bản" value={summary.published} tone="emerald" />
                <StatCard label="Nổi bật" value={summary.featured} tone="violet" icon={Star} />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 lg:grid-cols-12">
                        <input
                            value={filters.keyword}
                            onChange={(e) => updateFilter('keyword', e.target.value)}
                            placeholder="Tìm theo tiêu đề, slug..."
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
                            Đặt lại
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Bài viết</Th>
                                <Th>Trạng thái</Th>
                                <Th>Nổi bật</Th>
                                <Th>Ngày đăng</Th>
                                <Th>Người tạo</Th>
                                <Th>Cập nhật</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Đang tải bài viết...</p>
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
                                                        {blog.summary || 'Chưa có mô tả ngắn'}
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
                                                {blog.isFeatured ? 'Nổi bật' : 'Thông thường'}
                                            </span>
                                        </Td>
                                        <Td>{blog.publishedAtDisplay || 'Chưa xuất bản'}</Td>
                                        <Td>{blog.authorName || 'Quản trị CTUT Store'}</Td>
                                        <Td>{blog.updatedAt || '-'}</Td>
                                        <Td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => openDetail(blog)} className={smallButtonClass}>
                                                    <Eye size={15} /> Xem
                                                </button>
                                                <button type="button" onClick={() => openEdit(blog)} className={smallButtonClass}>
                                                    <Pencil size={15} /> Sửa
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
                                                    {blog.status === 'published' ? 'Ẩn' : 'Xuất bản'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(blog)}
                                                    className={blog.status === 'published' ? disabledButtonClass : dangerButtonClass}
                                                    disabled={blog.status === 'published'}
                                                    title={blog.status === 'published' ? 'Chuyển về bản nháp trước khi xóa' : 'Xóa bài viết'}
                                                >
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
                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">Chưa có bài viết nào</p>
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
                title={statusTarget?.nextStatus === 'published' ? 'Xuất bản bài viết' : 'Chuyển về bản nháp'}
                message={`Bạn muốn ${statusTarget?.nextStatus === 'published' ? 'xuất bản' : 'ẩn'} bài viết "${statusTarget?.title || ''}"?`}
                description="Bài viết ở trạng thái bản nháp sẽ không hiển thị ở giao diện người dùng."
                confirmText={statusTarget?.nextStatus === 'published' ? 'Xuất bản' : 'Chuyển về bản nháp'}
                type="warning"
                onConfirm={handleStatusUpdate}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Xóa bài viết"
                message={`Bạn muốn xóa bài viết "${deleteTarget?.title || ''}"?`}
                description={
                    deleteTarget?.status === 'published'
                        ? 'Bài viết đang xuất bản không được phép xóa. Vui lòng chuyển về bản nháp trước.'
                        : 'Dữ liệu sẽ được xóa mềm để tránh ảnh hưởng dữ liệu cũ.'
                }
                confirmText="Xóa bài viết"
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
    });
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (!open) return;

        setForm({
            title: blog?.title || '',
            summary: blog?.summary || '',
            content: blog?.content || '',
            thumbnail: blog?.thumbnail || '',
            status: blog?.status || 'draft',
            is_featured: blog?.isFeatured ?? false,
        });
    }, [open, blog]);

    if (!open) return null;

    const readOnly = mode === 'detail';
    const title = mode === 'create' ? 'Thêm bài viết' : mode === 'edit' ? 'Cập nhật bài viết' : 'Chi tiết bài viết';

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
            };

            if (mode === 'create') {
                await adminBlogService.createBlog(payload);
                toast.success('Đã tạo bài viết');
            } else {
                await adminBlogService.updateBlog(blog.id, payload);
                toast.success('Đã cập nhật bài viết');
            }

            onClose();
            await onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu bài viết');
        } finally {
            setSaving(false);
        }
    }

    async function handleThumbnailChange(e) {
        const file = e.target.files?.[0];

        if (!file) return;

        try {
            setUploadingImage(true);
            const uploaded = await adminBlogService.uploadThumbnail(file);
            updateField('thumbnail', uploaded.path || uploaded.url || '');
            toast.success('Tải ảnh đại diện thành công');
        } catch (error) {
            toast.error(error?.message || 'Không thể tải ảnh đại diện');
        } finally {
            setUploadingImage(false);
            e.target.value = '';
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
                            {readOnly ? 'Xem nội dung bài viết đang lưu trong hệ thống.' : 'Điền đầy đủ thông tin bài viết tin tức.'}
                        </p>
                    </div>

                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="max-h-[calc(92vh-74px)] space-y-4 overflow-y-auto p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tiêu đề bài viết">
                            <input
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className={controlClass}
                                disabled={readOnly}
                            />
                        </Field>

                        <Field label="Trạng thái">
                            <select
                                value={form.status}
                                onChange={(e) => updateField('status', e.target.value)}
                                className={controlClass}
                                disabled={readOnly}
                            >
                                <option value="draft">Bản nháp</option>
                                <option value="published">Đã xuất bản</option>
                            </select>
                        </Field>

                        <Field label="Ảnh blog">
                            <div className="space-y-3">
                                <label
                                    className={[
                                        'flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-950',
                                        readOnly ? 'cursor-default hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-950' : '',
                                    ].join(' ')}
                                >
                                    {form.thumbnail ? (
                                        <img
                                            src={form.thumbnail}
                                            alt="Ảnh blog"
                                            className="max-h-40 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                            <ImagePlus size={26} />
                                            <p className="text-sm font-medium">Chưa có ảnh blog</p>
                                        </div>
                                    )}

                                    {!readOnly ? (
                                        <>
                                            <span className="mt-3 text-sm font-semibold text-blue-700">
                                                {uploadingImage ? 'Đang tải ảnh lên...' : 'Chọn ảnh blog để tải lên'}
                                            </span>
                                            <span className="mt-1 text-xs text-slate-500">
                                                Hỗ trợ JPG, PNG, WEBP, GIF, SVG, AVIF
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleThumbnailChange}
                                                disabled={uploadingImage}
                                            />
                                        </>
                                    ) : null}
                                </label>

                                {form.thumbnail ? (
                                    <div className="flex items-center gap-2">
                                        <input value={form.thumbnail} className={controlClass} readOnly />
                                        {!readOnly ? (
                                            <button
                                                type="button"
                                                onClick={() => updateField('thumbnail', '')}
                                                className={secondaryOnlyClass}
                                            >
                                                Xóa ảnh
                                            </button>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </Field>

                        <Field label="Ngày giờ đăng bài">
                            <input
                                value={blog?.publishedAtDisplay || (form.status === 'published' ? 'Tự động lấy khi xuất bản' : 'Sẽ tự động lấy khi xuất bản')}
                                className={controlClass}
                                disabled
                                readOnly
                            />
                        </Field>
                    </div>

                    <Field label="Mô tả ngắn">
                        <textarea
                            rows={4}
                            value={form.summary}
                            onChange={(e) => updateField('summary', e.target.value)}
                            className={textareaClass}
                            disabled={readOnly}
                        />
                    </Field>

                    <Field label="Nội dung bài viết">
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
                        Đánh dấu bài viết nổi bật
                    </label>

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <button type="button" onClick={onClose} className={secondaryOnlyClass}>
                            {readOnly ? 'Đóng' : 'Hủy'}
                        </button>

                        {!readOnly && (
                            <button type="submit" disabled={saving} className={primaryButtonClass}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <SaveIcon />}
                                {mode === 'create' ? 'Tạo bài viết' : 'Lưu thay đổi'}
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
                Hiển thị <b>{showing}</b> / <b>{meta.total}</b> bài viết
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
                    Trước
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
            {status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
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
const disabledButtonClass =
    'inline-flex h-9 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400 opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500';
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
