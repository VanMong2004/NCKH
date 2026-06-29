import { BadgePercent, Edit3, Loader2, Plus, RefreshCcw, Search, Send, Sparkles, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import AdminPromotionFormModal from '../components/promotions/AdminPromotionFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import adminPromotionService from '../services/adminPromotionService';
import StatCard from '../components/ui/StatCard';

const facebookStyleOptions = [
    { value: 'intro', label: 'Giới thiệu' },
    { value: 'promotion', label: 'Khuyến mãi' },
    { value: 'sales', label: 'Bán hàng' },
];

export default function AdminPromotions() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [publishingId, setPublishingId] = useState(null);
    const [facebookModal, setFacebookModal] = useState({
        open: false,
        promotion: null,
        style: 'promotion',
        content: '',
        loadingPreview: false,
        submitting: false,
    });

    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
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

    const [formState, setFormState] = useState({
        open: false,
        mode: 'create',
        promotion: null,
    });

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
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadPromotions();
    }, [debouncedKeyword, filters.status, filters.page, filters.per_page]);

    async function loadPromotions() {
        try {
            setLoading(true);

            const result = await adminPromotionService.getPromotions({
                keyword: debouncedKeyword || undefined,
                status: filters.status || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setPromotions(result.promotions || []);
            setMeta(
                result.meta || {
                    currentPage: 1,
                    lastPage: 1,
                    perPage: filters.per_page,
                    total: 0,
                },
            );
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách khuyến mãi');
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

    function openCreateForm() {
        setFormState({
            open: true,
            mode: 'create',
            promotion: null,
        });
    }

    function openEditForm(promotion) {
        setFormState({
            open: true,
            mode: 'edit',
            promotion,
        });
    }

    function closeForm() {
        setFormState({
            open: false,
            mode: 'create',
            promotion: null,
        });
    }

    async function handleSavedPromotion() {
        await loadPromotions();
        closeForm();
    }

    function handleDelete(promotion) {
        setConfirmDialog({
            open: true,
            title: 'Xóa hoặc tắt khuyến mãi',
            message: `Bạn có chắc muốn xóa/tắt khuyến mãi "${promotion.title}"?`,
            description:
                'Nếu khuyến mãi đã phát sinh dữ liệu, hệ thống có thể chuyển sang trạng thái tắt thay vì xóa hẳn.',
            confirmText: 'Xóa/Tắt',
            type: 'danger',
            onConfirm: async () => {
                await deletePromotion(promotion);
            },
        });
    }

    async function deletePromotion(promotion) {
        try {
            setDeletingId(promotion.id);

            const result = await adminPromotionService.deletePromotion(promotion.id);

            toast.success(result.message || 'Đã xử lý khuyến mãi');

            await loadPromotions();
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa khuyến mãi');
        } finally {
            setDeletingId(null);
        }
    }

    function handlePublishSocial(promotion) {
        setFacebookModal({
            open: true,
            promotion,
            style: 'promotion',
            content: '',
            loadingPreview: true,
            submitting: false,
        });
        generateFacebookCaption(promotion.id, 'promotion');
        return;

        setConfirmDialog({
            open: true,
            title: 'Đăng khuyến mãi lên Facebook',
            message: `Đăng khuyến mãi "${promotion.title}" lên Facebook?`,
            description: 'Hệ thống sẽ gửi dữ liệu sang n8n để xử lý bài đăng.',
            confirmText: 'Đăng Facebook',
            type: 'info',
            onConfirm: async () => {
                await publishPromotionSocial(promotion);
            },
        });
    }

    async function publishPromotionSocial(promotion) {
        try {
            setPublishingId(promotion.id);

            const result = await adminPromotionService.publishSocial(promotion.id);

            toast.success(result.message || 'Đã gửi yêu cầu đăng Facebook');

            await loadPromotions();
        } catch (error) {
            toast.error(error?.message || 'Không thể gửi yêu cầu đăng Facebook');
        } finally {
            setPublishingId(null);
        }
    }

    async function generateFacebookCaption(promotionId, style) {
        try {
            setFacebookModal((current) => ({
                ...current,
                style,
                loadingPreview: true,
            }));

            const result = await adminPromotionService.generateFacebookCaption(promotionId, { style });

            setFacebookModal((current) => ({
                ...current,
                content: result?.data?.content || '',
                style: result?.data?.style || style,
            }));
        } catch (error) {
            toast.error(error?.message || 'Không thể tạo nội dung khuyến mãi bằng AI');
        } finally {
            setFacebookModal((current) => ({
                ...current,
                loadingPreview: false,
            }));
        }
    }

    async function submitPromotionSocial() {
        const promotion = facebookModal.promotion;

        if (!promotion) return;

        if (!facebookModal.content.trim()) {
            toast.error('Vui lòng nhập nội dung bài đăng Facebook');
            return;
        }

        try {
            setFacebookModal((current) => ({
                ...current,
                submitting: true,
            }));
            setPublishingId(promotion.id);

            const result = await adminPromotionService.publishSocial(promotion.id, {
                content: facebookModal.content,
                style: facebookModal.style,
            });

            toast.success(result.message || 'Đã gửi yêu cầu đăng Facebook');
            closeFacebookModal();

            await loadPromotions();
        } catch (error) {
            toast.error(error?.message || 'Không thể gửi yêu cầu đăng Facebook');
        } finally {
            setPublishingId(null);
            setFacebookModal((current) => ({
                ...current,
                submitting: false,
            }));
        }
    }

    function closeFacebookModal() {
        setFacebookModal({
            open: false,
            promotion: null,
            style: 'promotion',
            content: '',
            loadingPreview: false,
            submitting: false,
        });
    }

    const summary = useMemo(() => {
        return {
            total: meta.total,
            active: promotions.filter((item) => item.status === 'active').length,
            draft: promotions.filter((item) => item.status === 'draft').length,
            inactive: promotions.filter((item) => item.status === 'inactive').length,
        };
    }, [promotions, meta.total]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Khuyến mãi</h1>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Quản lý các đợt khuyến mãi chính. Sau bước này sẽ gắn sản phẩm vào từng khuyến mãi.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    <Plus size={17} />
                    Thêm khuyến mãi
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng khuyến mãi" value={summary.total} tone="blue" />
                <StatCard label="Đang bật" value={summary.active} tone="emerald" />
                <StatCard label="Bản nháp" value={summary.draft} tone="amber" />
                <StatCard label="Đã tắt" value={summary.inactive} tone="slate" />
            </div>

            <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_44px]">
                        <div className="relative">
                            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                value={filters.keyword}
                                onChange={(e) => updateFilter('keyword', e.target.value)}
                                placeholder="Tìm tên hoặc slug khuyến mãi..."
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="draft">Bản nháp</option>
                            <option value="active">Đang bật</option>
                            <option value="inactive">Đã tắt</option>
                            <option value="upcoming">Sắp diễn ra</option>
                            <option value="ended">Đã kết thúc</option>
                        </select>

                        <button
                            type="button"
                            onClick={loadPromotions}
                            className="flex h-10 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Làm mới"
                        >
                            <RefreshCcw size={15} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-[360px] items-center justify-center">
                        <div className="text-center">
                            <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
                            <p className="mt-3 text-sm text-slate-500">Đang tải khuyến mãi...</p>
                        </div>
                    </div>
                ) : promotions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <Th>Khuyến mãi</Th>
                                    <Th>Ưu đãi</Th>
                                    <Th>Thời gian</Th>
                                    <Th>Sản phẩm</Th>
                                    <Th>Trạng thái</Th>
                                    <Th>Hiển thị</Th>
                                    <Th className="text-right">Thao tác</Th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {promotions.map((promotion) => (
                                    <tr
                                        key={promotion.id}
                                        className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                                    >
                                        <Td>
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                                    <BadgePercent size={18} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="line-clamp-1 font-semibold text-slate-900 dark:text-white">
                                                        {promotion.title}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-500">{promotion.slug}</p>
                                                </div>
                                            </div>
                                        </Td>

                                        <Td>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {promotion.discountText}
                                            </span>
                                        </Td>

                                        <Td>
                                            <div className="space-y-1 text-xs">
                                                <p>Bắt đầu: {promotion.startDate || '—'}</p>
                                                <p>Kết thúc: {promotion.endDate || '—'}</p>
                                            </div>
                                        </Td>

                                        <Td>{promotion.itemsCount}</Td>

                                        <Td>
                                            <StatusBadge status={promotion.status}>{promotion.statusText}</StatusBadge>
                                        </Td>

                                        <Td>
                                            {promotion.isActive ? (
                                                <span className="text-sm font-semibold text-emerald-600">Có</span>
                                            ) : (
                                                <span className="text-sm font-semibold text-slate-500">Không</span>
                                            )}
                                        </Td>

                                        <Td>
                                            <div className="flex justify-end gap-1.5">
                                                <Link
                                                    to={`/admin/promotions/${promotion.id}`}
                                                    className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                >
                                                    Chi tiết
                                                </Link>

                                                <IconButton
                                                    title="Đăng Facebook"
                                                    disabled={publishingId === promotion.id}
                                                    onClick={() => handlePublishSocial(promotion)}
                                                >
                                                    {publishingId === promotion.id ? (
                                                        <Loader2 size={15} className="animate-spin" />
                                                    ) : (
                                                        <Send size={15} />
                                                    )}
                                                </IconButton>

                                                <IconButton title="Sửa" onClick={() => openEditForm(promotion)}>
                                                    <Edit3 size={15} />
                                                </IconButton>

                                                <IconButton
                                                    title="Xóa/Tắt"
                                                    danger
                                                    disabled={deletingId === promotion.id}
                                                    onClick={() => handleDelete(promotion)}
                                                >
                                                    {deletingId === promotion.id ? (
                                                        <Loader2 size={15} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={15} />
                                                    )}
                                                </IconButton>
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-slate-500">Không có khuyến mãi phù hợp.</p>
                    </div>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <p className="text-sm text-slate-500">
                        Hiển thị <b>{promotions.length}</b> / <b>{meta.total}</b> khuyến mãi
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={meta.currentPage <= 1 || loading}
                            onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                            className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium disabled:opacity-50 dark:border-slate-700"
                        >
                            Trước
                        </button>

                        <span className="text-sm text-slate-600 dark:text-slate-300">
                            Trang {meta.currentPage}/{meta.lastPage}
                        </span>

                        <button
                            type="button"
                            disabled={meta.currentPage >= meta.lastPage || loading}
                            onClick={() => updateFilter('page', Math.min(meta.lastPage, filters.page + 1))}
                            className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium disabled:opacity-50 dark:border-slate-700"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </section>

            <AdminPromotionFormModal
                open={formState.open}
                mode={formState.mode}
                promotion={formState.promotion}
                onClose={closeForm}
                onSaved={handleSavedPromotion}
            />

            <FacebookCaptionModal
                state={facebookModal}
                onClose={closeFacebookModal}
                onChange={(field, value) => {
                    setFacebookModal((current) => ({
                        ...current,
                        [field]: value,
                    }));
                }}
                onRegenerate={() => generateFacebookCaption(facebookModal.promotion?.id, facebookModal.style)}
                onSubmit={submitPromotionSocial}
            />

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

function FacebookCaptionModal({ state, onClose, onChange, onRegenerate, onSubmit }) {
    if (!state.open) return null;

    const isBusy = state.loadingPreview || state.submitting;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3">
            <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-800">
                    <div>
                        <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-300">AI Facebook</p>
                        <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                            Tạo nội dung khuyến mãi
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {state.promotion?.title || 'Khuyến mãi'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div className="grid gap-3 sm:grid-cols-[220px_auto] sm:items-end">
                        <label className="block">
                            <span className="mb-1 block text-xs font-bold uppercase text-slate-500">
                                Phong cách viết
                            </span>
                            <select
                                value={state.style}
                                onChange={(event) => onChange('style', event.target.value)}
                                disabled={isBusy}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                                {facebookStyleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="button"
                            onClick={onRegenerate}
                            disabled={isBusy}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                        >
                            {state.loadingPreview ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Tạo lại bằng AI
                        </button>
                    </div>

                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase text-slate-500">
                            Nội dung sẽ đăng
                        </span>
                        <textarea
                            value={state.content}
                            onChange={(event) => onChange('content', event.target.value)}
                            rows={10}
                            disabled={state.loadingPreview || state.submitting}
                            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            placeholder="Nội dung AI sẽ hiển thị ở đây, admin có thể chỉnh trước khi đăng."
                        />
                    </label>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 sm:flex-row sm:justify-end dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isBusy || !state.content.trim()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        {state.submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Đăng Facebook
                    </button>
                </div>
            </div>
        </div>
    );
}

function Th({ children, className = '' }) {
    return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

function Td({ children }) {
    return <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{children}</td>;
}

function StatusBadge({ status, children }) {
    const className =
        status === 'active'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : status === 'draft'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

    return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
    );
}

function IconButton({ children, title, danger = false, disabled = false, onClick }) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={[
                'flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50',
                danger
                    ? 'border-red-100 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
            ].join(' ')}
        >
            {children}
        </button>
    );
}
