import {
    BarChart3,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    Eye,
    Gift,
    Loader2,
    Package,
    RefreshCw,
    ShoppingBag,
    Star,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import userAnalyticsService from '../../services/userAnalyticsService';

export default function AccountOverview() {
    const [analytics, setAnalytics] = useState(null);
    const [months, setMonths] = useState(12);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState('');

    useEffect(() => {
        loadAnalytics();
    }, [months]);

    async function loadAnalytics() {
        try {
            setLoading(true);

            const [overviewData, ordersData, spendingData] = await Promise.all([
                userAnalyticsService.overview(),
                userAnalyticsService.orders(months),
                userAnalyticsService.spending(months),
            ]);

            setAnalytics({
                ...overviewData,
                orders: ordersData,
                spending: spendingData,
            });
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Không thể tải thống kê cá nhân';

            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleExport(type) {
        try {
            setExporting(type);

            if (type === 'excel') {
                await userAnalyticsService.exportExcel();
                toast.success('Đã tải file Excel');
                return;
            }

            await userAnalyticsService.exportPdf();
            toast.success('Đã tải file PDF');
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Không thể xuất báo cáo';

            toast.error(message);
        } finally {
            setExporting('');
        }
    }

    const summaryCards = useMemo(() => {
        if (!analytics) return [];

        return [
            {
                label: 'Tổng đơn hàng',
                value: formatNumber(analytics.orders.totalOrders),
                description: 'Tất cả đơn hàng cá nhân',
                icon: Package,
            },
            {
                label: 'Tổng chi tiêu',
                value: formatCurrency(analytics.spending.totalSpent),
                description: 'Tính trên đơn đã thanh toán',
                icon: Wallet,
            },
            {
                label: 'Campaign đã tham gia',
                value: formatNumber(analytics.campaigns.totalCampaigns),
                description: `${analytics.campaigns.activeCampaigns} đang diễn ra`,
                icon: Gift,
            },
            {
                label: 'Sản phẩm đã đánh giá',
                value: formatNumber(analytics.interests.reviewedProducts.length),
                description: 'Đánh giá gần đây của bạn',
                icon: Star,
            },
        ];
    }, [analytics]);

    if (loading && !analytics) {
        return <AccountOverviewLoading />;
    }

    if (!analytics) {
        return (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                    <RefreshCw size={24} />
                </div>

                <h1 className="mt-5 text-xl font-black text-blue-950 dark:text-white">
                    Không thể tải thống kê tài khoản
                </h1>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Vui lòng thử tải lại dữ liệu.</p>

                <button
                    type="button"
                    onClick={loadAnalytics}
                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                    <RefreshCw size={16} />
                    Tải lại
                </button>
            </section>
        );
    }

    return (
        <div className="space-y-7">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            <BarChart3 size={13} />
                            Thống kê cá nhân
                        </div>

                        <h1 className="mt-3 text-3xl font-black text-blue-950 dark:text-white">Tổng quan tài khoản</h1>

                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Theo dõi đơn hàng, chi tiêu, chiến dịch đã tham gia và sản phẩm bạn quan tâm.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={months}
                            onChange={(e) => setMonths(Number(e.target.value))}
                            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-blue-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value={3}>3 tháng</option>
                            <option value={6}>6 tháng</option>
                            <option value={12}>12 tháng</option>
                            <option value={24}>24 tháng</option>
                        </select>

                        <button
                            type="button"
                            onClick={loadAnalytics}
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Tải lại
                        </button>

                        <button
                            type="button"
                            onClick={() => handleExport('excel')}
                            disabled={Boolean(exporting)}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            {exporting === 'excel' ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            Excel
                        </button>

                        <button
                            type="button"
                            onClick={() => handleExport('pdf')}
                            disabled={Boolean(exporting)}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                            {exporting === 'pdf' ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            PDF
                        </button>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <SummaryCard key={card.label} card={card} />
                ))}
            </section>

            <section className="grid gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                <MonthlyBarChart
                    title="Đơn hàng theo tháng"
                    description={`Số lượng đơn hàng trong ${months} tháng gần đây.`}
                    data={analytics.orders.monthlyOrders}
                    icon={Package}
                    valueFormatter={formatNumber}
                    emptyMessage="Chưa có dữ liệu đơn hàng theo tháng."
                />

                <StatusBreakdown items={analytics.orders.statusBreakdown} title="Tỷ lệ trạng thái đơn hàng" />
            </section>

            <section className="grid gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                <MonthlyBarChart
                    title="Chi tiêu theo tháng"
                    description={`Tổng chi tiêu trong ${months} tháng gần đây.`}
                    data={analytics.spending.monthlySpending}
                    icon={TrendingUp}
                    valueFormatter={formatCurrency}
                    emptyMessage="Chưa có dữ liệu chi tiêu theo tháng."
                />

                <SpendingCategoryList items={analytics.spending.spendingByCategory} />
            </section>

            <section className="grid gap-7 xl:grid-cols-2">
                <RecentOrders orders={analytics.orders.recentOrders} />

                <TrackingOrders orders={analytics.tracking.orders} lastUpdatedAt={analytics.tracking.lastUpdatedAt} />
            </section>

            <section className="grid gap-7 xl:grid-cols-2">
                <CampaignOverview campaigns={analytics.campaigns} />

                <InterestOverview interests={analytics.interests} />
            </section>
        </div>
    );
}

function SummaryCard({ card }) {
    const Icon = card.icon;

    return (
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon size={24} />
            </div>

            <p className="mt-5 text-2xl font-black text-blue-950 dark:text-white">{card.value}</p>

            <h2 className="mt-1 text-sm font-black text-blue-950 dark:text-white">{card.label}</h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{card.description}</p>
        </article>
    );
}

function MonthlyBarChart({ title, description, data = [], icon: Icon, valueFormatter, emptyMessage }) {
    const maxValue = Math.max(...data.map((item) => Number(item.total || 0)), 0);

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <Icon size={21} />
                </div>

                <div>
                    <h2 className="text-lg font-black text-blue-950 dark:text-white">{title}</h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>

            {data.length === 0 ? (
                <EmptyBlock message={emptyMessage} />
            ) : (
                <div className="mt-6 space-y-4">
                    {data.map((item) => {
                        const percent = maxValue > 0 ? (Number(item.total) / maxValue) * 100 : 0;

                        return (
                            <div key={item.month}>
                                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                    <span className="font-bold text-blue-950 dark:text-white">
                                        {formatMonth(item.month)}
                                    </span>

                                    <span className="font-black text-blue-700 dark:text-blue-300">
                                        {valueFormatter(item.total)}
                                    </span>
                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-blue-600 transition-all"
                                        style={{
                                            width: `${Math.max(percent, 4)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function StatusBreakdown({ items = [], title }) {
    const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <CheckCircle2 size={21} />
                </div>

                <div>
                    <h2 className="text-lg font-black text-blue-950 dark:text-white">{title}</h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Phân bổ đơn hàng theo trạng thái.</p>
                </div>
            </div>

            {items.length === 0 ? (
                <EmptyBlock message="Chưa có dữ liệu trạng thái đơn hàng." />
            ) : (
                <div className="mt-6 space-y-3">
                    {items.map((item) => {
                        const percent = total > 0 ? Math.round((item.total / total) * 100) : 0;

                        return (
                            <div
                                key={item.status}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-black text-blue-950 dark:text-white">
                                        {getOrderStatusLabel(item.status)}
                                    </span>

                                    <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                                        {item.total} đơn · {percent}%
                                    </span>
                                </div>

                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-blue-600"
                                        style={{
                                            width: `${Math.max(percent, 4)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function SpendingCategoryList({ items = [] }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <CreditCard size={21} />
                </div>

                <div>
                    <h2 className="text-lg font-black text-blue-950 dark:text-white">Chi tiêu theo loại sản phẩm</h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Nhóm danh mục có chi tiêu cao nhất.
                    </p>
                </div>
            </div>

            {items.length === 0 ? (
                <EmptyBlock message="Chưa có dữ liệu chi tiêu theo danh mục." />
            ) : (
                <div className="mt-6 space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.categoryId || item.categoryName}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                        >
                            <div>
                                <p className="text-sm font-black text-blue-950 dark:text-white">{item.categoryName}</p>

                                <p className="text-xs text-slate-500 dark:text-slate-400">Tổng chi tiêu</p>
                            </div>

                            <p className="text-sm font-black text-blue-700 dark:text-blue-300">
                                {formatCurrency(item.total)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function RecentOrders({ orders = [] }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle icon={Clock3} title="Đơn hàng gần đây" description="5 đơn hàng mới nhất trong tài khoản." />

            {orders.length === 0 ? (
                <EmptyBlock message="Bạn chưa có đơn hàng gần đây." />
            ) : (
                <div className="mt-5 space-y-3">
                    {orders.map((order) => (
                        <OrderRow key={order.id} order={order} />
                    ))}
                </div>
            )}
        </section>
    );
}

function TrackingOrders({ orders = [], lastUpdatedAt }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle
                icon={Package}
                title="Theo dõi đơn hàng"
                description={
                    lastUpdatedAt ? `Cập nhật lúc ${lastUpdatedAt}` : 'Theo dõi trạng thái các đơn đang xử lý.'
                }
            />

            {orders.length === 0 ? (
                <EmptyBlock message="Không có đơn hàng đang theo dõi." />
            ) : (
                <div className="mt-5 space-y-3">
                    {orders.slice(0, 5).map((order) => (
                        <OrderRow key={order.id} order={order} showProgress />
                    ))}
                </div>
            )}
        </section>
    );
}

function OrderRow({ order, showProgress = false }) {
    return (
        <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        to={`/account/orders/${order.id}`}
                        className="text-sm font-black text-blue-950 transition hover:text-blue-700 dark:text-white dark:hover:text-blue-300"
                    >
                        {order.orderCode || `Đơn hàng #${order.id}`}
                    </Link>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {order.updatedAt || 'Đang cập nhật'}
                    </p>
                </div>

                <div className="text-left sm:text-right">
                    <p className="text-sm font-black text-blue-700 dark:text-blue-300">{formatCurrency(order.total)}</p>

                    <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {getOrderStatusLabel(order.status)}
                    </p>
                </div>
            </div>

            {showProgress && order.progress.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {order.progress.map((step) => (
                        <div
                            key={step.key}
                            className={[
                                'rounded-xl px-3 py-2 text-xs font-bold',
                                step.done
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                                    : 'bg-white text-slate-400 dark:bg-slate-900 dark:text-slate-500',
                            ].join(' ')}
                        >
                            {step.label}
                        </div>
                    ))}
                </div>
            ) : null}
        </article>
    );
}

function CampaignOverview({ campaigns }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle
                icon={Gift}
                title="Thống kê campaign"
                description={`${campaigns.activeCampaigns} campaign đang diễn ra, ${campaigns.completedCampaigns} đã hoàn thành.`}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniStat label="Đã tham gia" value={campaigns.totalCampaigns} />
                <MiniStat label="Đang diễn ra" value={campaigns.activeCampaigns} />
                <MiniStat label="Hoàn thành" value={campaigns.completedCampaigns} />
            </div>

            <div className="mt-5">
                <h3 className="text-sm font-black text-blue-950 dark:text-white">Sản phẩm đã đăng ký</h3>

                {campaigns.registeredProducts.length === 0 ? (
                    <EmptyBlock message="Chưa có sản phẩm đăng ký trong campaign." />
                ) : (
                    <div className="mt-3 space-y-3">
                        {campaigns.registeredProducts.slice(0, 5).map((item) => (
                            <div
                                key={item.userCampaignItemId}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                            >
                                <p className="text-sm font-black text-blue-950 dark:text-white">
                                    {item.productName || 'Sản phẩm'}
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    SL đăng ký: {item.quantity} · Duyệt: {item.approvedQuantity} · Trạng thái:{' '}
                                    {item.status}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function InterestOverview({ interests }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle icon={Eye} title="Sản phẩm quan tâm" description="Sản phẩm đã mua, đã xem và đã đánh giá." />

            <div className="mt-5 space-y-5">
                <InterestList
                    title="Mua nhiều nhất"
                    icon={ShoppingBag}
                    items={interests.mostPurchasedProducts.map((item) => ({
                        id: item.productId,
                        name: item.name,
                        meta: `${item.totalQuantity} sản phẩm`,
                        slug: item.slug,
                    }))}
                    empty="Chưa có sản phẩm mua nhiều."
                />

                <InterestList
                    title="Xem gần đây"
                    icon={Eye}
                    items={interests.mostViewedProducts.map((item) => ({
                        id: item.productId,
                        name: item.name,
                        meta: item.viewedAt,
                        slug: item.slug,
                    }))}
                    empty="Chưa có sản phẩm đã xem."
                />

                <InterestList
                    title="Đã đánh giá"
                    icon={Star}
                    items={interests.reviewedProducts.map((item) => ({
                        id: item.reviewId,
                        name: item.productName,
                        meta: `${item.rating} sao · ${item.createdAt}`,
                        slug: '',
                    }))}
                    empty="Chưa có đánh giá sản phẩm."
                />
            </div>
        </section>
    );
}

function InterestList({ title, icon: Icon, items = [], empty }) {
    return (
        <div>
            <div className="flex items-center gap-2">
                <Icon size={16} className="text-blue-700 dark:text-blue-300" />
                <h3 className="text-sm font-black text-blue-950 dark:text-white">{title}</h3>
            </div>

            {items.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{empty}</p>
            ) : (
                <div className="mt-3 space-y-2">
                    {items.slice(0, 4).map((item) => {
                        const content = (
                            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950">
                                <p className="line-clamp-1 text-sm font-bold text-blue-950 dark:text-white">
                                    {item.name || 'Sản phẩm'}
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {item.meta || 'Đang cập nhật'}
                                </p>
                            </div>
                        );

                        if (item.slug) {
                            return (
                                <Link key={item.id} to={`/products/${item.slug}`}>
                                    {content}
                                </Link>
                            );
                        }

                        return <div key={item.id}>{content}</div>;
                    })}
                </div>
            )}
        </div>
    );
}

function SectionTitle({ icon: Icon, title, description }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon size={21} />
            </div>

            <div>
                <h2 className="text-lg font-black text-blue-950 dark:text-white">{title}</h2>

                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
    );
}

function MiniStat({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{formatNumber(value)}</p>

            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}

function EmptyBlock({ message }) {
    return (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{message}</p>
        </div>
    );
}

function AccountOverviewLoading() {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Loader2 size={26} className="animate-spin" />
            </div>

            <p className="mt-4 text-sm font-black text-blue-950 dark:text-white">Đang tải thống kê cá nhân...</p>
        </section>
    );
}

function getOrderStatusLabel(status) {
    const labels = {
        pending: 'Chờ xử lý',
        paid: 'Đã thanh toán',
        processing: 'Đang xử lý',
        ready_to_pickup: 'Sẵn sàng nhận hàng',
        delivered: 'Đã giao',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return labels[status] || status || 'Đang cập nhật';
}

function formatMonth(value) {
    if (!value) return 'Đang cập nhật';

    const [year, month] = String(value).split('-');

    if (!year || !month) return value;

    return `Tháng ${month}/${year}`;
}

function formatCurrency(value) {
    const number = Number(value || 0);

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(number);
}

function formatNumber(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}
