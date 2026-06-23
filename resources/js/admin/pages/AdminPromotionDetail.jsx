import { ArrowLeft, BadgePercent, Edit3, Loader2, PackagePlus, RefreshCcw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import AdminPromotionItemFormModal from '../components/promotions/AdminPromotionItemFormModal';
import { formatMoney } from '../mappers/adminPromotionMapper';
import adminPromotionService from '../services/adminPromotionService';
import StatCard from '../components/ui/StatCard';

export default function AdminPromotionDetail() {
    const { id } = useParams();

    const [promotion, setPromotion] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const [formState, setFormState] = useState({
        open: false,
        mode: 'create',
        item: null,
    });

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function loadData() {
        try {
            setLoading(true);

            const [promotionResult, itemsResult] = await Promise.all([
                adminPromotionService.getPromotion(id),
                adminPromotionService.getPromotionItems(id),
            ]);

            setPromotion(promotionResult);
            setItems(itemsResult.items || []);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải chi tiết khuyến mãi');
        } finally {
            setLoading(false);
        }
    }

    function openCreateForm() {
        setFormState({
            open: true,
            mode: 'create',
            item: null,
        });
    }

    function openEditForm(item) {
        setFormState({
            open: true,
            mode: 'edit',
            item,
        });
    }

    function closeForm() {
        setFormState({
            open: false,
            mode: 'create',
            item: null,
        });
    }

    async function handleSavedItem() {
        await loadData();
        closeForm();
    }

    async function handleDelete(item) {
        const ok = window.confirm(
            `Bạn muốn xóa hoặc tắt "${item.productName}" khỏi khuyến mãi?\n\nNếu mục này đã có số lượng đã bán/đang giữ, hệ thống có thể chuyển sang trạng thái tắt thay vì xóa hẳn.`,
        );

        if (!ok) return;

        try {
            setDeletingId(item.id);

            const result = await adminPromotionService.deletePromotionItem(item.id);

            toast.success(result.message || 'Đã xử lý sản phẩm khuyến mãi');
            await loadData();
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa sản phẩm khỏi khuyến mãi');
        } finally {
            setDeletingId(null);
        }
    }

    const summary = useMemo(() => {
        return {
            total: items.length,
            active: items.filter((item) => item.isActive).length,
            sold: items.reduce((sum, item) => sum + Number(item.soldQuantity || 0), 0),
            reserved: items.reduce((sum, item) => sum + Number(item.reservedQuantity || 0), 0),
            remaining: items.reduce((sum, item) => {
                if (item.remainingQuantity === null) return sum;
                return sum + Number(item.remainingQuantity || 0);
            }, 0),
        };
    }, [items]);

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="text-center">
                    <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
                    <p className="mt-3 text-sm text-slate-500">Đang tải chi tiết khuyến mãi...</p>
                </div>
            </div>
        );
    }

    if (!promotion) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">Không tìm thấy khuyến mãi.</p>

                <Link to="/admin/promotions" className="mt-4 inline-flex text-sm font-semibold text-blue-600">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Link
                        to="/admin/promotions"
                        className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Quay lại khuyến mãi
                    </Link>

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{promotion.title}</h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý sản phẩm, phân loại, giới hạn và số lượng đã dùng trong chương trình.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                    <PackagePlus size={17} />
                    Thêm sản phẩm
                </button>
            </div>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard label="Ưu đãi chính" value={promotion.discountText} />
                <InfoCard label="Trạng thái" value={promotion.computedStatusText || promotion.statusText} />
                <InfoCard label="Bắt đầu" value={promotion.startDate || '—'} />
                <InfoCard label="Kết thúc" value={promotion.endDate || '—'} />
            </section>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng item" value={summary.total} tone="blue" />
                <StatCard label="Đang áp dụng" value={summary.active} tone="emerald" />
                <StatCard label="Đã bán" value={summary.sold} tone="violet" />
                <StatCard label="Đang giữ chỗ" value={summary.reserved} tone="amber" />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white">Sản phẩm áp dụng</h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Danh sách sản phẩm hoặc phân loại đang nằm trong khuyến mãi.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadData}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <RefreshCcw size={15} />
                        Tải lại
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Sản phẩm</Th>
                                <Th>Phân loại</Th>
                                <Th>Giảm riêng</Th>
                                <Th className="text-center">Giới hạn</Th>
                                <Th className="text-center">Đã bán</Th>
                                <Th className="text-center">Đang giữ</Th>
                                <Th className="text-center">Còn lại</Th>
                                <Th>Trạng thái</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {items.length > 0 ? (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.productThumbnail}
                                                    alt={item.productName}
                                                    className="h-12 w-12 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/images/no-image.png';
                                                    }}
                                                />

                                                <div className="min-w-0">
                                                    <p className="max-w-[260px] truncate font-semibold text-slate-900 dark:text-white">
                                                        {item.productName || 'Sản phẩm'}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        Mã SP: {item.productId || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            {item.productVariantId ? (
                                                <div className="text-xs leading-5 text-slate-500">
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                        {item.variantSku || `#${item.productVariantId}`}
                                                    </p>

                                                    <p>
                                                        {item.variantSize ? `Size ${item.variantSize}` : ''}
                                                        {item.variantSize && item.variantColor ? ' · ' : ''}
                                                        {item.variantColor || ''}
                                                    </p>

                                                    {item.variantPrice > 0 && <p>{formatMoney(item.variantPrice)}</p>}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500">Tất cả phân loại</span>
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900 dark:text-white">
                                            {item.discountText}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center">
                                            {item.limitQuantity === '' ? 'Không giới hạn' : item.limitQuantity}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center">
                                            {item.soldQuantity || 0}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center">
                                            {item.reservedQuantity || 0}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center">
                                            {item.remainingQuantity === null
                                                ? 'Không giới hạn'
                                                : item.remainingQuantity}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <ItemStatusBadge active={item.isActive} />
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(item)}
                                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    <Edit3 size={15} />
                                                    Sửa
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={deletingId === item.id}
                                                    onClick={() => handleDelete(item)}
                                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10"
                                                >
                                                    {deletingId === item.id ? (
                                                        <Loader2 size={15} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={15} />
                                                    )}
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <BadgePercent size={30} className="mx-auto text-slate-300" />

                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                                            Chưa có sản phẩm nào trong khuyến mãi
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Bấm “Thêm sản phẩm” để chọn sản phẩm hoặc phân loại áp dụng.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <AdminPromotionItemFormModal
                open={formState.open}
                mode={formState.mode}
                promotionId={id}
                item={formState.item}
                onClose={closeForm}
                onSaved={handleSavedItem}
            />
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{value || '—'}</p>
        </div>
    );
}

function ItemStatusBadge({ active }) {
    return active ? (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Đang áp dụng
        </span>
    ) : (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Đã tắt
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
