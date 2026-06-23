import {
    BadgePercent,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Home,
    Loader2,
    Package,
    ShoppingBag,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import ProductGrid from '../components/product/ProductGrid';
import MainLayout from '../layout/MainLayout';
import promotionService from '../services/promotionService';

export default function PromotionDetail() {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [promotion, setPromotion] = useState(null);
    const [products, setProducts] = useState([]);
    const [detailItems, setDetailItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 12,
        total: 0,
    });

    const page = Number(searchParams.get('page') || 1);

    useEffect(() => {
        loadPromotion();
    }, [slug, page]);

    async function loadPromotion() {
        if (!slug) return;

        try {
            setLoading(true);

            const [detail, productResult] = await Promise.all([
                promotionService.getPromotionBySlug(slug),
                promotionService.getPromotionProducts(slug, {
                    page,
                    per_page: 12,
                }),
            ]);

            setPromotion(detail);
            setDetailItems(detail.items || []);
            setProducts(productResult.products || []);
            setMeta(productResult.meta);
        } catch (error) {
            toast.error(error.message || 'Không thể tải chi tiết khuyến mãi');
            setPromotion(null);
        } finally {
            setLoading(false);
        }
    }

    function updatePage(nextPage) {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(nextPage));
        setSearchParams(params);
    }

    if (loading) {
        return (
            <MainLayout>
                <main className="bg-slate-50 px-4 py-20 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-10 text-center font-bold text-blue-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                        <Loader2 size={28} className="mx-auto mb-3 animate-spin" />
                        Đang tải khuyến mãi...
                    </div>
                </main>
            </MainLayout>
        );
    }

    if (!promotion) {
        return (
            <MainLayout>
                <main className="bg-slate-50 px-4 py-20 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">
                            Không tìm thấy đợt khuyến mãi
                        </h1>

                        <Link
                            to="/promotions"
                            className="mt-5 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white dark:bg-blue-700"
                        >
                            Quay lại danh sách khuyến mãi
                        </Link>
                    </div>
                </main>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <main className="bg-slate-50 py-6 dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-4">
                    <Breadcrumb title={promotion.title} />

                    <PromotionHero promotion={promotion} />

                    <section className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="min-w-0">
                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h2 className="text-xl font-extrabold text-blue-950 dark:text-white">
                                            Sản phẩm áp dụng
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Các sản phẩm đang được áp dụng trong đợt khuyến mãi này.
                                        </p>
                                    </div>

                                    <Link
                                        to="/shop"
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-950 px-4 text-sm font-bold text-blue-950 transition hover:bg-blue-50 dark:border-blue-300 dark:text-blue-300 dark:hover:bg-slate-800"
                                    >
                                        <ShoppingBag size={16} />
                                        Xem cửa hàng
                                    </Link>
                                </div>

                                <div className="mt-5">
                                    {products.length > 0 ? (
                                        <ProductGrid products={products} />
                                    ) : (
                                        <EmptyBlock message="Chưa có sản phẩm áp dụng cho đợt khuyến mãi này." />
                                    )}
                                </div>

                                {products.length > 0 && (
                                    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <p className="text-sm font-semibold text-blue-950 dark:text-white">
                                            Hiển thị {products.length} / {meta.total} sản phẩm
                                        </p>

                                        <Pagination meta={meta} onPageChange={updatePage} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <aside className="space-y-5">
                            <PromotionInfo promotion={promotion} />
                            <PromotionItems items={detailItems} />
                        </aside>
                    </section>
                </div>
            </main>
        </MainLayout>
    );
}

function Breadcrumb({ title }) {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>
            <ChevronRight size={14} />
            <Link to="/promotions" className="hover:text-blue-950 dark:hover:text-blue-300">
                Đợt khuyến mãi
            </Link>
            <ChevronRight size={14} />
            <span className="line-clamp-1 text-blue-950 dark:text-blue-300">{title}</span>
        </div>
    );
}

function PromotionHero({ promotion }) {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-blue-950 shadow-sm dark:border-slate-800">
            <div className="relative min-h-[360px]">
                <img
                    src={promotion.banner || promotion.thumbnail || '/images/no-image.png'}
                    alt={promotion.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = '/images/no-image.png';
                    }}
                />

                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-950/75 to-blue-950/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                <div className="relative z-10 flex min-h-[360px] items-center px-5 py-8 sm:px-8 lg:px-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-sm backdrop-blur">
                            <BadgePercent size={14} />
                            {promotion.discountText}
                        </div>

                        <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:text-5xl">
                            {promotion.title}
                        </h1>

                        {promotion.description && (
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                                {promotion.description}
                            </p>
                        )}

                        <div className="mt-7 flex flex-wrap gap-3">
                            <a
                                href="#promotion-products"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-blue-950 transition hover:bg-blue-50"
                            >
                                Xem sản phẩm
                                <ChevronRight size={16} />
                            </a>

                            <Link
                                to="/promotions"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
                            >
                                Đợt khuyến mãi khác
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function PromotionInfo({ promotion }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">Thông tin khuyến mãi</h2>

            <div className="mt-4 space-y-3 text-sm">
                <InfoRow icon={BadgePercent} label="Ưu đãi" value={promotion.discountText} />
                <InfoRow icon={CalendarDays} label="Bắt đầu" value={promotion.startDate} />
                <InfoRow icon={CalendarDays} label="Kết thúc" value={promotion.endDate} />
                <InfoRow icon={Package} label="Sản phẩm áp dụng" value={`${promotion.totalItems} sản phẩm`} />

                {promotion.countdownSeconds > 0 && (
                    <InfoRow
                        icon={Clock3}
                        label="Thời gian còn lại"
                        value={`${promotion.countdown.days} ngày ${promotion.countdown.hours} giờ`}
                    />
                )}
            </div>
        </section>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon size={18} />
            </div>

            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-0.5 font-extrabold text-blue-950 dark:text-white">{value || '—'}</p>
            </div>
        </div>
    );
}

function PromotionItems({ items = [] }) {
    if (items.length === 0) return null;

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">Phân loại áp dụng</h2>

            <div className="mt-4 space-y-3">
                {items.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                        <img
                            src={item.product?.thumbnail || '/images/no-image.png'}
                            alt={item.product?.name || 'Sản phẩm'}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                            onError={(e) => {
                                e.currentTarget.src = '/images/no-image.png';
                            }}
                        />

                        <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-bold text-blue-950 dark:text-white">
                                {item.product?.name || 'Sản phẩm'}
                            </p>

                            {(item.variant?.size || item.variant?.color || item.variant?.sku) && (
                                <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                                    {item.variant?.sku ? `SKU: ${item.variant.sku}` : ''}
                                    {item.variant?.sku && (item.variant?.size || item.variant?.color) ? ' · ' : ''}
                                    {item.variant?.size ? `Size ${item.variant.size}` : ''}
                                    {item.variant?.size && item.variant?.color ? ' · ' : ''}
                                    {item.variant?.color || ''}
                                </p>
                            )}

                            <p className="mt-1 text-xs font-bold text-red-500">
                                Còn lại:{' '}
                                {item.remainingQuantity === null || item.remainingQuantity === undefined
                                    ? 'Không giới hạn'
                                    : item.remainingQuantity}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function EmptyBlock({ message }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{message}</p>
        </div>
    );
}

function Pagination({ meta, onPageChange }) {
    if (meta.lastPage <= 1) return null;

    return (
        <div className="hidden items-center gap-2 md:flex">
            <PageButton disabled={meta.currentPage <= 1} onClick={() => onPageChange(meta.currentPage - 1)}>
                <ChevronLeft size={16} />
            </PageButton>

            <PageButton active>{meta.currentPage}</PageButton>

            <PageButton disabled={meta.currentPage >= meta.lastPage} onClick={() => onPageChange(meta.currentPage + 1)}>
                <ChevronRight size={16} />
            </PageButton>
        </div>
    );
}

function PageButton({ children, active = false, disabled = false, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                'flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-bold disabled:opacity-50',
                active
                    ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-700 dark:bg-blue-700'
                    : 'border-slate-200 bg-white text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white',
            ].join(' ')}
        >
            {children}
        </button>
    );
}
