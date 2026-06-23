import { Eye, EyeOff, Loader2, RefreshCcw, Search, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import AdminReviewDetailModal from '../components/reviews/AdminReviewDetailModal';
import { getReviewStatusText } from '../mappers/adminReviewMapper';
import adminReviewService from '../services/adminReviewService';
import StatCard from '../components/ui/StatCard';

const ratingOptions = [
    { value: '', label: 'Tất cả số sao' },
    { value: '5', label: '5 sao' },
    { value: '4', label: '4 sao' },
    { value: '3', label: '3 sao' },
    { value: '2', label: '2 sao' },
    { value: '1', label: '1 sao' },
];

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'visible', label: 'Đang hiển thị' },
    { value: 'hidden', label: 'Đã ẩn' },
    { value: 'deleted', label: 'Đã xóa' },
];

const sortOptions = [
    { value: 'latest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'highest', label: 'Sao cao nhất' },
    { value: 'lowest', label: 'Sao thấp nhất' },
];

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [statistics, setStatistics] = useState(null);

    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);

    const [filters, setFilters] = useState({
        keyword: '',
        rating: '',
        status: '',
        date_from: '',
        date_to: '',
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
        reviewId: null,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedKeyword,
        filters.rating,
        filters.status,
        filters.date_from,
        filters.date_to,
        filters.sort,
        filters.page,
        filters.per_page,
    ]);

    useEffect(() => {
        loadStatistics();
    }, []);

    async function loadStatistics() {
        try {
            const result = await adminReviewService.getStatistics();
            setStatistics(result);
        } catch {
            setStatistics(null);
        }
    }

    async function loadReviews() {
        try {
            setLoading(true);

            const result = await adminReviewService.getReviews({
                keyword: debouncedKeyword || undefined,
                rating: filters.rating || undefined,
                status: filters.status || undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
                sort: filters.sort || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setReviews(result.reviews || []);
            setMeta(
                result.meta || {
                    currentPage: 1,
                    lastPage: 1,
                    perPage: filters.per_page,
                    total: 0,
                },
            );
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách đánh giá');
        } finally {
            setLoading(false);
        }
    }

    async function refreshAll() {
        await Promise.all([loadReviews(), loadStatistics()]);
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
            rating: '',
            status: '',
            date_from: '',
            date_to: '',
            sort: 'latest',
            page: 1,
            per_page: 10,
        });

        setDebouncedKeyword('');
    }

    function openDetail(review) {
        setDetailState({
            open: true,
            reviewId: review.id,
        });
    }

    function closeDetail() {
        setDetailState({
            open: false,
            reviewId: null,
        });
    }

    async function handleShow(review) {
        try {
            setActionId(review.id);

            await adminReviewService.showReview(review.id);

            toast.success('Đã hiển thị đánh giá');
            await refreshAll();
        } catch (error) {
            toast.error(error?.message || 'Không thể hiển thị đánh giá');
        } finally {
            setActionId(null);
        }
    }

    async function handleHide(review) {
        const ok = window.confirm('Bạn muốn ẩn đánh giá này khỏi website?');

        if (!ok) return;

        try {
            setActionId(review.id);

            await adminReviewService.hideReview(review.id);

            toast.success('Đã ẩn đánh giá');
            await refreshAll();
        } catch (error) {
            toast.error(error?.message || 'Không thể ẩn đánh giá');
        } finally {
            setActionId(null);
        }
    }

    async function handleDelete(review) {
        const ok = window.confirm(
            'Bạn muốn xóa đánh giá này?\n\nĐánh giá đã xóa sẽ không hiển thị lại được từ màn hình này.',
        );

        if (!ok) return;

        try {
            setActionId(review.id);

            const result = await adminReviewService.deleteReview(review.id);

            toast.success(result.message || 'Đã xóa đánh giá');
            await refreshAll();
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa đánh giá');
        } finally {
            setActionId(null);
        }
    }

    const pageSummary = useMemo(() => {
        return {
            total: meta.total,
            visible: reviews.filter((item) => item.status === 'visible').length,
            hidden: reviews.filter((item) => item.status === 'hidden').length,
            deleted: reviews.filter((item) => item.status === 'deleted').length,
            lowRating: reviews.filter((item) => Number(item.rating || 0) <= 2).length,
        };
    }, [reviews, meta.total]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đánh giá sản phẩm</h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Xem nội dung đánh giá, hình ảnh và xử lý trạng thái hiển thị.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={refreshAll}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    Tải lại
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Tổng review" value={statistics?.totalReviews ?? pageSummary.total} tone="blue" />
                <StatCard
                    label="Đang hiển thị"
                    value={statistics?.visibleReviews ?? pageSummary.visible}
                    tone="emerald"
                />
                <StatCard label="Đã ẩn" value={statistics?.hiddenReviews ?? pageSummary.hidden} tone="amber" />
                <StatCard label="Đã xóa" value={statistics?.deletedReviews ?? pageSummary.deleted} tone="slate" />
                <StatCard label="Điểm trung bình" value={`${statistics?.averageRating || 0}/5`} tone="violet" />
            </div>

            <section className="grid gap-4 lg:grid-cols-12">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white">Phân bố số sao</h2>
                            <p className="mt-1 text-sm text-slate-500">Tổng hợp theo đánh giá hiện có.</p>
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-slate-500">Trung bình</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {statistics?.averageRating || 0}/5
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = Number(statistics?.ratingBreakdown?.[star] || 0);
                            const total = Number(statistics?.totalReviews || 0);
                            const percent = total > 0 ? Math.round((count / total) * 100) : 0;

                            return (
                                <div key={star} className="flex items-center gap-3">
                                    <div className="flex w-16 items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        {star}
                                        <Star size={14} className="fill-amber-400 text-amber-400" />
                                    </div>

                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-slate-900 dark:bg-white"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>

                                    <div className="w-16 text-right text-sm text-slate-500">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
                    <h2 className="font-bold text-slate-900 dark:text-white">Cần chú ý</h2>

                    <div className="mt-4 grid gap-3">
                        <InfoLine
                            label="Đánh giá thấp"
                            value={statistics?.lowRatingReviews ?? pageSummary.lowRating}
                            hint="Đánh giá từ 1 đến 2 sao"
                        />

                        <InfoLine
                            label="Đánh giá có ảnh trang này"
                            value={reviews.filter((item) => item.images?.length > 0).length}
                            hint="Nên kiểm tra nội dung ảnh"
                        />

                        <InfoLine
                            label="Đang ẩn trang này"
                            value={pageSummary.hidden}
                            hint="Không hiển thị ngoài website"
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 lg:grid-cols-12">
                        <div className="relative lg:col-span-3">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                value={filters.keyword}
                                onChange={(e) => updateFilter('keyword', e.target.value)}
                                placeholder="Tìm sản phẩm, người dùng..."
                                className={controlClass + ' pl-9'}
                            />
                        </div>

                        <select
                            value={filters.rating}
                            onChange={(e) => updateFilter('rating', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {ratingOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

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

                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => updateFilter('date_from', e.target.value)}
                            className={controlClass + ' lg:col-span-1'}
                        />

                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => updateFilter('date_to', e.target.value)}
                            className={controlClass + ' lg:col-span-1'}
                        />

                        <select
                            value={filters.sort}
                            onChange={(e) => updateFilter('sort', e.target.value)}
                            className={controlClass + ' lg:col-span-1'}
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
                                <Th>Đánh giá</Th>
                                <Th>Sản phẩm</Th>
                                <Th>Người dùng</Th>
                                <Th>Đơn hàng</Th>
                                <Th className="text-center">Ảnh</Th>
                                <Th>Trạng thái</Th>
                                <Th>Ngày gửi</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Đang tải đánh giá...</p>
                                    </td>
                                </tr>
                            ) : reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                        <td className="px-4 py-4">
                                            <div className="min-w-[220px]">
                                                <RatingStars rating={review.rating} />

                                                <p className="mt-2 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                                                    {review.comment || 'Không có nội dung'}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="min-w-0">
                                                <p className="max-w-[220px] truncate font-semibold text-slate-900 dark:text-white">
                                                    {review.product?.name || 'Sản phẩm'}
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {review.product?.slug || '—'}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={review.user?.avatar || '/images/no-image.png'}
                                                    alt={review.user?.name || 'Người dùng'}
                                                    className="h-9 w-9 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/images/no-image.png';
                                                    }}
                                                />

                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        {review.user?.name || 'Người dùng'}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {review.user?.email || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                                            {review.orderCode || (review.orderId ? `#${review.orderId}` : '—')}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center">
                                            {review.images?.length || 0}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <ReviewStatusBadge status={review.status}>
                                                {getReviewStatusText(review.status)}
                                            </ReviewStatusBadge>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                                            {review.createdAt || '—'}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openDetail(review)}
                                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    <Eye size={15} />
                                                    Chi tiết
                                                </button>

                                                {review.status !== 'deleted' &&
                                                    (review.status === 'visible' ? (
                                                        <button
                                                            type="button"
                                                            disabled={actionId === review.id}
                                                            onClick={() => handleHide(review)}
                                                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                        >
                                                            {actionId === review.id ? (
                                                                <Loader2 size={15} className="animate-spin" />
                                                            ) : (
                                                                <EyeOff size={15} />
                                                            )}
                                                            Ẩn
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={actionId === review.id}
                                                            onClick={() => handleShow(review)}
                                                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                        >
                                                            {actionId === review.id ? (
                                                                <Loader2 size={15} className="animate-spin" />
                                                            ) : (
                                                                <Eye size={15} />
                                                            )}
                                                            Hiện
                                                        </button>
                                                    ))}

                                                {review.status !== 'deleted' && (
                                                    <button
                                                        type="button"
                                                        disabled={actionId === review.id}
                                                        onClick={() => handleDelete(review)}
                                                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10"
                                                    >
                                                        {actionId === review.id ? (
                                                            <Loader2 size={15} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={15} />
                                                        )}
                                                        Xóa
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <Star size={30} className="mx-auto text-slate-300" />

                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                                            Không có đánh giá phù hợp
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
                        Hiển thị <b>{reviews.length}</b> / <b>{meta.total}</b> đánh giá
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

            <AdminReviewDetailModal
                open={detailState.open}
                reviewId={detailState.reviewId}
                onClose={closeDetail}
                onUpdated={refreshAll}
            />
        </div>
    );
}


function InfoLine({ label, value, hint }) {
    return (
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="font-bold text-slate-900 dark:text-white">{value || 0}</p>
            </div>

            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
    );
}

function RatingStars({ rating }) {
    const value = Number(rating || 0);

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={15}
                    className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                />
            ))}
        </div>
    );
}

function ReviewStatusBadge({ status, children }) {
    const key = String(status || '').toLowerCase();

    const className =
        key === 'visible'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : key === 'hidden'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
              : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300';

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>
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

const controlClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
