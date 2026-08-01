import {
    BadgePercent,
    Edit3,
    Loader2,
    Plus,
    RefreshCcw,
    Search,
    Send,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
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

function getPromotionSocialBlockedMessage(promotion) {
    if (!promotion?.isActive) {
        return 'Khuyến mãi đang tắt, không thể đăng Facebook';
    }

    if (promotion.timelineStatus === 'draft' || promotion.timelineStatus === 'upcoming') {
        return 'Khuyến mãi chưa hoạt động, không thể đăng Facebook';
    }

    if (promotion.timelineStatus === 'ended') {
        return 'Khuyến mãi đã kết thúc, không thể đăng Facebook';
    }

    if (!promotion.itemsCount) {
        return 'Khuyến mãi chưa có sản phẩm áp dụng, không thể đăng Facebook';
    }

    return '';
}

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
        progress: '',
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedKeyword, filters.status, filters.progress, filters.page, filters.per_page]);

    async function loadPromotions() {
        try {
            setLoading(true);

            const result = await adminPromotionService.getPromotions({
                keyword: debouncedKeyword || undefined,
                status: filters.status || undefined,
                progress: filters.progress || undefined,
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

    function resetFilters() {
        setFilters({
            keyword: '',
            status: '',
            progress: '',
            page: 1,
            per_page: 10,
        });
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
        if (promotion.isItemLocked) {
            toast.warning('Khuyến mãi đang diễn ra nên không thể xóa');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Xóa khuyến mãi',
            message: `Bạn có chắc muốn xóa khuyến mãi "${promotion.title}"?`,
            description:
                'Nếu khuyến mãi đã phát sinh dữ liệu bán hàng, hệ thống sẽ tự chuyển sang trạng thái đã tắt thay vì xóa hẳn.',
            confirmText: 'Xóa khuyến mãi',
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
        const blockedMessage = getPromotionSocialBlockedMessage(promotion);

        if (blockedMessage) {
            toast.error(blockedMessage);
            return;
        }

        setFacebookModal({
            open: true,
            promotion,
            style: 'promotion',
            content: '',
            loadingPreview: true,
            submitting: false,
        });

        generateFacebookCaption(promotion.id, 'promotion');
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
                        Quản lý các đợt khuyến mãi chính. Sau bước này sẽ gắn sản phẩm và mức giảm riêng cho từng sản phẩm.
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
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_44px_140px]">
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
                        </select>

                        <select
                            value={filters.progress}
                            onChange={(e) => updateFilter('progress', e.target.value)}
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">Tất cả diễn biến</option>
                            <option value="active">Đang diễn ra</option>
                            <option value="ending_soon">Sắp kết thúc</option>
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

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Đặt lại bộ lọc
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
                        <table className="w-full min-w-[1320px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <Th>Ảnh</Th>
                                    <Th>Khuyến mãi</Th>
                                    <Th>Ưu đãi</Th>
                                    <Th>Thời gian</Th>
                                    <Th>Sản phẩm</Th>
                                    <Th>Trạng thái</Th>
                                    <Th>Diễn biến</Th>
                                    <Th>Hiển thị</Th>
                                    <Th className="text-right">Thao tác</Th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {promotions.map((promotion) => (
                                    <tr
                                        key={promotion.id}
                                        className={[
                                            'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60',
                                            promotion.status === 'draft' || promotion.status === 'inactive' ? 'opacity-60' : '',
                                        ].join(' ')}
                                    >
                                        <Td>
                                            <img
                                                src={promotion.image}
                                                alt={promotion.title}
                                                className="h-14 w-14 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/no-image.png';
                                                }}
                                            />
                                        </Td>

                                        <Td>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{promotion.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">{promotion.slug}</p>
                                            </div>
                                        </Td>

                                        <Td>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                Theo từng sản phẩm
                                            </span>
                                        </Td>

                                        <Td>
                                            <div className="text-xs leading-5 text-slate-500">
                                                <p>Bắt đầu: {promotion.startDate || '—'}</p>
                                                <p>Kết thúc: {promotion.endDate || '—'}</p>
                                            </div>
                                        </Td>

                                        <Td>{promotion.itemsCount}</Td>

                                        <Td>
                                            <StatusBadge type="status" value={promotion.status} label={promotion.statusText} />
                                        </Td>

                                        <Td>
                                            <StatusBadge
                                                type="timeline"
                                                value={promotion.timelineStatus}
                                                label={promotion.timelineStatusText}
                                            />
                                        </Td>

                                        <Td>{promotion.isActive ? 'Có' : 'Không'}</Td>

                                        <Td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    to={`/admin/promotions/${promotion.id}`}
                                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    Chi tiết
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() => handlePublishSocial(promotion)}
                                                    disabled={publishingId === promotion.id}
                                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    title="Đăng Facebook"
                                                >
                                                    {publishingId === promotion.id ? (
                                                        <Loader2 size={15} className="animate-spin" />
                                                    ) : (
                                                        <Send size={15} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(promotion)}
                                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    title="Sửa"
                                                >
                                                    <Edit3 size={15} />
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={deletingId === promotion.id || promotion.isItemLocked}
                                                    onClick={() => handleDelete(promotion)}
                                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10"
                                                    title={promotion.isItemLocked ? 'Khuyến mãi đang diễn ra, không thể xóa' : 'Xóa'}
                                                >
                                                    {deletingId === promotion.id ? (
                                                        <Loader2 size={15} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={15} />
                                                    )}
                                                </button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex min-h-[360px] items-center justify-center">
                        <div className="text-center">
                            <BadgePercent size={30} className="mx-auto text-slate-300" />
                            <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">Chưa có khuyến mãi nào</p>
                            <p className="mt-1 text-sm text-slate-500">Thử đổi bộ lọc hoặc tạo mới một đợt khuyến mãi.</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">
                    <p>
                        Hiển thị {promotions.length} / {meta.total} khuyến mãi
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={meta.currentPage <= 1}
                            onClick={() => updateFilter('page', meta.currentPage - 1)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                        >
                            Trước
                        </button>

                        <span>
                            Trang {meta.currentPage}/{meta.lastPage}
                        </span>

                        <button
                            type="button"
                            disabled={meta.currentPage >= meta.lastPage}
                            onClick={() => updateFilter('page', meta.currentPage + 1)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
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

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                description={confirmDialog.description}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onOpenChange={(next) => setConfirmDialog((prev) => ({ ...prev, open: next }))}
            />

            {facebookModal.open && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 py-6">
                    <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                    Đăng Facebook cho khuyến mãi
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Xem trước và chỉnh sửa nội dung trước khi gửi sang n8n.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeFacebookModal}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto p-5">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Phong cách nội dung
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {facebookStyleOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => generateFacebookCaption(facebookModal.promotion?.id, option.value)}
                                            className={[
                                                'rounded-lg border px-3 py-2 text-sm font-semibold transition',
                                                facebookModal.style === option.value
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-200'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                                            ].join(' ')}
                                        >
                                            <Sparkles size={15} className="mr-1 inline-block" />
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Nội dung bài đăng
                                </label>
                                <textarea
                                    value={facebookModal.content}
                                    onChange={(e) =>
                                        setFacebookModal((current) => ({
                                            ...current,
                                            content: e.target.value,
                                        }))
                                    }
                                    rows={10}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                            </div>

                            {facebookModal.loadingPreview && (
                                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                                    <Loader2 size={16} className="animate-spin" />
                                    Đang tạo nội dung bằng AI...
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={closeFacebookModal}
                                disabled={facebookModal.submitting}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                onClick={submitPromotionSocial}
                                disabled={facebookModal.submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {facebookModal.submitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                                Gửi sang n8n
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ type, value, label }) {
    const classes = {
        draft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        upcoming: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
        ending_soon: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
        ended: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    };

    return (
        <span
            className={[
                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                classes[value] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                type === 'timeline' ? 'min-w-[110px] justify-center' : '',
            ].join(' ')}
        >
            {label}
        </span>
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
    return <td className={`px-4 py-4 align-middle ${className}`}>{children}</td>;
}
