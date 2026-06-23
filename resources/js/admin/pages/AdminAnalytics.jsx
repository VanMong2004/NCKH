import {
    BarChart3,
    CalendarDays,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Package,
    RefreshCcw,
    ShoppingCart,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import StatCard from '../components/ui/StatCard';
import { formatMoney, formatNumber, getDateLabel } from '../mappers/adminAnalyticMapper';
import adminAnalyticsService from '../services/adminAnalyticService';

const dayOptions = [
    { value: 7, label: '7 ngày' },
    { value: 30, label: '30 ngày' },
    { value: 90, label: '90 ngày' },
    { value: 365, label: '365 ngày' },
];

export default function AdminAnalytics() {
    const [overview, setOverview] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [salesChart, setSalesChart] = useState([]);

    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState('');

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days]);

    async function loadAll() {
        try {
            setLoading(true);

            const [overviewResult, topProductsResult, salesChartResult] = await Promise.all([
                adminAnalyticsService.getOverview(),
                adminAnalyticsService.getTopProducts(),
                adminAnalyticsService.getSalesChart(days),
            ]);

            setOverview(overviewResult);
            setTopProducts(topProductsResult.products || []);
            setSalesChart(salesChartResult.chart || []);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    }

    async function handleExport(type) {
        try {
            setExporting(type);

            if (type === 'pdf') {
                await adminAnalyticsService.exportPdf();
                toast.success('Đã tải báo cáo PDF');
            } else {
                await adminAnalyticsService.exportExcel();
                toast.success('Đã tải báo cáo Excel');
            }
        } catch (error) {
            toast.error(error?.message || 'Không thể xuất báo cáo');
        } finally {
            setExporting('');
        }
    }

    const computed = useMemo(() => {
        const revenue = salesChart.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
        const orders = salesChart.reduce((sum, item) => sum + Number(item.ordersCount || 0), 0);
        const average = orders > 0 ? revenue / orders : 0;

        return {
            revenue,
            orders,
            average,
        };
    }, [salesChart]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thống kê hệ thống</h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi doanh thu, đơn hàng, người dùng và sản phẩm bán chạy.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                        {dayOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={loadAll}
                        disabled={loading}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                        Tải lại
                    </button>

                    <button
                        type="button"
                        onClick={() => handleExport('excel')}
                        disabled={Boolean(exporting)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        {exporting === 'excel' ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <FileSpreadsheet size={16} />
                        )}
                        Excel
                    </button>

                    <button
                        type="button"
                        onClick={() => handleExport('pdf')}
                        disabled={Boolean(exporting)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        PDF
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                    icon={ShoppingCart}
                    label="Tổng đơn hàng"
                    value={formatNumber(overview?.totalOrders || 0)}
                    loading={loading}
                    tone="blue"
                />

                <StatCard
                    icon={TrendingUp}
                    label="Doanh thu ghi nhận"
                    value={formatMoney(overview?.revenue || 0)}
                    loading={loading}
                    tone="rose"
                />

                <StatCard
                    icon={ShoppingCart}
                    label="Đơn hoàn tất"
                    value={formatNumber(overview?.completedOrders || 0)}
                    loading={loading}
                    tone="emerald"
                />

                <StatCard
                    icon={Package}
                    label="Sản phẩm đang bán"
                    value={formatNumber(overview?.activeProducts || 0)}
                    loading={loading}
                    tone="violet"
                />

                <StatCard
                    icon={Users}
                    label="Người dùng"
                    value={formatNumber(overview?.totalUsers || 0)}
                    loading={loading}
                    tone="amber"
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Chờ xử lý"
                    value={formatNumber(overview?.pendingOrders || 0)}
                    tone="amber"
                    loading={loading}
                />

                <StatCard
                    label="Đã thanh toán / đang xử lý"
                    value={formatNumber(overview?.paidOrders || 0)}
                    tone="blue"
                    loading={loading}
                />

                <StatCard
                    label="Đã hủy"
                    value={formatNumber(overview?.cancelledOrders || 0)}
                    tone="gray"
                    loading={loading}
                />

                <StatCard
                    label="Doanh thu hoàn tất"
                    value={formatMoney(overview?.completedRevenue || 0)}
                    tone="emerald"
                    loading={loading}
                />
            </div>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white">Doanh thu theo ngày</h2>

                            <p className="mt-1 text-sm text-slate-500">Tổng hợp trong {days} ngày gần nhất.</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CalendarDays size={16} />
                            {days} ngày
                        </div>
                    </div>

                    <div className="p-4">
                        {loading ? <LoadingBlock text="Đang tải biểu đồ..." /> : <SalesBarChart data={salesChart} />}
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} className="text-slate-500" />
                            <h2 className="font-bold text-slate-900 dark:text-white">Tổng hợp kỳ đang xem</h2>
                        </div>

                        <div className="mt-4 space-y-3 text-sm">
                            <InfoLine label="Doanh thu" value={formatMoney(computed.revenue)} />
                            <InfoLine label="Số đơn" value={formatNumber(computed.orders)} />
                            <InfoLine label="Trung bình / đơn" value={formatMoney(computed.average)} />
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-slate-500" />
                            <h2 className="font-bold text-slate-900 dark:text-white">Ghi chú số liệu</h2>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            Doanh thu ghi nhận hiện tính trên các đơn đã thanh toán, đang xử lý, đã giao hoặc hoàn tất.
                            Doanh thu hoàn tất chỉ tính đơn ở trạng thái hoàn tất.
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <h2 className="font-bold text-slate-900 dark:text-white">Sản phẩm bán chạy</h2>

                    <p className="mt-1 text-sm text-slate-500">Xếp theo số lượng bán ra.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Sản phẩm</Th>
                                <Th>Slug</Th>
                                <Th className="text-center">Đã bán</Th>
                                <Th>Doanh thu</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Đang tải sản phẩm bán chạy...</p>
                                    </td>
                                </tr>
                            ) : topProducts.length > 0 ? (
                                topProducts.map((product, index) => (
                                    <tr
                                        key={product.id || index}
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                                    >
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                    {index + 1}
                                                </div>

                                                <p className="max-w-[360px] truncate font-semibold text-slate-900 dark:text-white">
                                                    {product.name || 'Sản phẩm'}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                                            {product.slug || '—'}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center font-semibold text-slate-900 dark:text-white">
                                            {formatNumber(product.sold || 0)}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900 dark:text-white">
                                            {formatMoney(product.revenue || 0)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center">
                                        <Package size={30} className="mx-auto text-slate-300" />

                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                                            Chưa có sản phẩm bán chạy
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Khi có đơn hàng phát sinh, dữ liệu sẽ hiển thị tại đây.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function SalesBarChart({ data }) {
    const maxRevenue = Math.max(...data.map((item) => Number(item.revenue || 0)), 1);
    const visibleData = data.length > 45 ? data.slice(-45) : data;

    if (!data.length) {
        return (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Chưa có dữ liệu doanh thu</p>
                <p className="mt-1 text-sm text-slate-500">Dữ liệu sẽ hiển thị khi có đơn hàng hợp lệ.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex h-72 items-end gap-2 overflow-x-auto border-b border-slate-200 pb-3 dark:border-slate-800">
                {visibleData.map((item) => {
                    const percent = Math.max(2, Math.round((Number(item.revenue || 0) / maxRevenue) * 100));

                    return (
                        <div
                            key={item.date}
                            className="flex min-w-[36px] flex-1 flex-col items-center justify-end gap-2"
                            title={`${getDateLabel(item.date)}: ${formatMoney(item.revenue)} - ${item.ordersCount} đơn`}
                        >
                            <div className="flex h-56 w-full items-end rounded bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="w-full rounded bg-slate-900 dark:bg-white"
                                    style={{ height: `${percent}%` }}
                                />
                            </div>

                            <span className="w-full truncate text-center text-[11px] text-slate-500">
                                {getDateLabel(item.date, true)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {data.length > visibleData.length && (
                <p className="text-xs text-slate-500">
                    Đang hiển thị {visibleData.length} ngày gần nhất để biểu đồ dễ đọc.
                </p>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-950/60">
                        <tr>
                            <Th>Ngày</Th>
                            <Th className="text-center">Số đơn</Th>
                            <Th>Doanh thu</Th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data
                            .slice(-10)
                            .reverse()
                            .map((item) => (
                                <tr key={item.date}>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                                        {getDateLabel(item.date)}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">
                                        {formatNumber(item.ordersCount || 0)}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                        {formatMoney(item.revenue || 0)}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function InfoLine({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
        </div>
    );
}

function LoadingBlock({ text }) {
    return (
        <div className="flex h-72 items-center justify-center">
            <div className="text-center">
                <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                <p className="mt-3 text-sm text-slate-500">{text}</p>
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
