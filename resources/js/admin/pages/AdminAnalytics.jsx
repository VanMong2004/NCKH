import {
    BarChart3,
    Download,
    Eye,
    FileSpreadsheet,
    Info,
    Loader2,
    Package,
    Percent,
    RefreshCcw,
    ShoppingCart,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { toast } from 'react-toastify';

import StatCard from '../components/ui/StatCard';
import { formatMoney, formatNumber, mapAdminAnalyticsBehaviorOverviewResponse } from '../mappers/adminAnalyticMapper';
import adminAnalyticsService from '../services/adminAnalyticService';

const quickRanges = [
    { value: 7, label: '7 ngày' },
    { value: 30, label: '30 ngày' },
    { value: 90, label: '3 tháng' },
    { value: 365, label: '1 năm' },
];

const groupOptions = [
    { value: 'day', label: 'Ngày' },
    { value: 'week', label: 'Tuần' },
    { value: 'month', label: 'Tháng' },
    { value: 'year', label: 'Năm' },
];

const defaultFilter = { days: 30, groupBy: 'day', dateFrom: '', dateTo: '' };
const chartColors = ['#2563eb', '#7c3aed', '#059669', '#f59e0b', '#e11d48', '#64748b'];

export default function AdminAnalytics() {
    const [overview, setOverview] = useState(null);
    const [behavior, setBehavior] = useState(null);
    const [trafficChart, setTrafficChart] = useState([]);
    const [revenueChart, setRevenueChart] = useState([]);
    const [ordersChart, setOrdersChart] = useState([]);
    const [funnelBehavior, setFunnelBehavior] = useState(null);
    const [rateBehavior, setRateBehavior] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [topViewedProducts, setTopViewedProducts] = useState([]);
    const [categoryRevenue, setCategoryRevenue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState('');

    const [globalFilter, setGlobalFilter] = useState({ ...defaultFilter });
    const [revenueFilter, setRevenueFilter] = useState({ ...defaultFilter });

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!window.Echo) return undefined;

        const token = localStorage.getItem('ctut_token');
        const authHeaders = window.Echo?.connector?.pusher?.config?.auth?.headers;

        if (authHeaders) {
            authHeaders.Authorization = token ? `Bearer ${token}` : '';
        }

        const channelName = 'admin.analytics';
        const channel = window.Echo.private(channelName)
            .listen('.analytics.updated', (event) => {
                if (event.summary) {
                    setBehavior(mapAdminAnalyticsBehaviorOverviewResponse({ data: event.summary }));
                }
            });

        return () => {
            channel.stopListening('.analytics.updated');
            window.Echo.leave(channelName);
        };
    }, []);

    async function loadAll() {
        try {
            setLoading(true);
            const globalParams = paramsFromFilter(globalFilter);
            const revenueParams = paramsFromFilter(revenueFilter);

            const [
                overviewResult,
                behaviorResult,
                revenueResult,
                ordersResult,
                trafficResult,
                funnelResult,
                ratesResult,
                categoryResult,
                productResult,
                viewedProductResult,
            ] = await Promise.all([
                adminAnalyticsService.getOverview(),
                adminAnalyticsService.getBehaviorOverview(globalFilter.days, globalParams),
                adminAnalyticsService.getSalesChart(revenueFilter.days, revenueParams),
                adminAnalyticsService.getSalesChart(globalFilter.days, globalParams),
                adminAnalyticsService.getBehaviorChart(globalFilter.days, globalParams),
                adminAnalyticsService.getBehaviorOverview(globalFilter.days, globalParams),
                adminAnalyticsService.getBehaviorOverview(globalFilter.days, globalParams),
                adminAnalyticsService.getRevenueByCategory(8, globalParams),
                adminAnalyticsService.getTopProducts({ ...globalParams, limit: 10 }),
                adminAnalyticsService.getTopViewedProducts({ limit: 10 }),
            ]);

            setOverview(overviewResult);
            setBehavior(behaviorResult);
            setRevenueChart(revenueResult.chart || []);
            setOrdersChart(ordersResult.chart || []);
            setTrafficChart(trafficResult.chart || []);
            setFunnelBehavior(funnelResult);
            setRateBehavior(ratesResult);
            setCategoryRevenue(categoryResult.categories || []);
            setTopProducts(productResult.products || []);
            setTopViewedProducts(viewedProductResult.products || []);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    }

    async function refreshRevenueChart() {
        const filter = revenueFilter;
        const params = paramsFromFilter(filter);

        try {
            const result = await adminAnalyticsService.getSalesChart(filter.days, params);
            setRevenueChart(result.chart || []);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải biểu đồ');
        }
    }

    function updateGlobalFilter(field, value) {
        setGlobalFilter((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function updateRevenueFilter(field, value) {
        setRevenueFilter((current) => ({
            ...current,
            [field]: value,
        }));
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
        const revenue = revenueChart.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
        const orders = ordersChart.reduce((sum, item) => sum + Number(item.ordersCount || 0), 0);
        const average = orders > 0 ? revenue / orders : 0;
        return { revenue, orders, average };
    }, [ordersChart, revenueChart]);

    const orderStatusData = useMemo(() => ([
        { label: 'Chờ xử lý', value: overview?.pendingOrders || 0 },
        { label: 'Đang xử lý', value: overview?.paidOrders || 0 },
        { label: 'Hoàn tất', value: overview?.completedOrders || 0 },
        { label: 'Đã hủy', value: overview?.cancelledOrders || 0 },
    ]), [overview]);

    const rates = useMemo(() => {
        const source = rateBehavior || behavior;
        return [
            { label: 'Add to Cart', value: source?.addToCartRate || 0, tooltip: 'Tỷ lệ giữa số lượt thêm vào giỏ hàng và số lượt xem sản phẩm.' },
            { label: 'Rate Checkout', value: source?.checkoutRate || 0, tooltip: 'Tỷ lệ giữa số lượt bắt đầu thanh toán và số lượt thêm vào giỏ hàng.' },
            { label: 'Rate Purchase', value: source?.purchaseRate || 0, tooltip: 'Tỷ lệ giữa số lượt mua hàng hoàn tất và số lượt bắt đầu thanh toán.' },
            { label: 'Rate Conversion', value: source?.conversionRate || 0, tooltip: 'Tỷ lệ giữa số lượt mua hàng hoàn tất và tổng lượt truy cập.' },
            { label: 'Rate Repeat', value: source?.repeatPurchaseRate || 0, tooltip: 'Tỷ lệ khách hàng có từ 2 đơn hàng hợp lệ trở lên trong kỳ đang xem.' },
            { label: 'Bounce Rate', value: source?.bounceRate || 0, tooltip: 'Tỷ lệ phiên truy cập chỉ xem đúng một trang và không có hành động tương tác khác.' },
        ];
    }, [behavior, rateBehavior]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thống kê hệ thống</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi doanh thu, đơn hàng, hành vi truy cập và hiệu quả chuyển đổi.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                        {exporting === 'excel' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
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

            <Panel title="Bộ lọc tổng" icon={RefreshCcw}>
                <ChartFilter filter={globalFilter} onChange={updateGlobalFilter} onApply={loadAll} />
            </Panel>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <MetricCard icon={ShoppingCart} label="Tổng đơn hàng" tooltip="Tổng số đơn hàng đã được tạo trong hệ thống." value={formatNumber(overview?.totalOrders || 0)} loading={loading} tone="blue" />
                <MetricCard icon={TrendingUp} label="Doanh thu ghi nhận" tooltip="Tổng doanh thu từ các đơn đã thanh toán, đang xử lý, đã giao hoặc hoàn tất." value={formatMoney(overview?.revenue || 0)} loading={loading} tone="rose" />
                <MetricCard icon={Package} label="Sản phẩm đang bán" tooltip="Số sản phẩm đang được bật bán trên website." value={formatNumber(overview?.activeProducts || 0)} loading={loading} tone="violet" />
                <MetricCard icon={Eye} label="Lượt xem sản phẩm" tooltip="Tổng số lượt mở trang chi tiết sản phẩm, lấy từ cột view_count của bảng products." value={formatNumber(overview?.productViewCount || 0)} loading={loading} tone="slate" />
                <MetricCard icon={Users} label="Người dùng" tooltip="Tổng số tài khoản người dùng trong hệ thống." value={formatNumber(overview?.totalUsers || 0)} loading={loading} tone="amber" />
                <MetricCard icon={Percent} label="Tỷ lệ chuyển đổi" tooltip="Tỷ lệ giữa số lượt mua hàng hoàn tất và tổng lượt truy cập." value={`${formatNumber(behavior?.conversionRate || 0)}%`} loading={loading} tone="emerald" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
                <Panel title="Trạng thái đơn hàng" icon={BarChart3}>
                    {loading ? <SmallLoading /> : <DonutChart data={orderStatusData} />}
                </Panel>

                <Panel title="Doanh thu" icon={TrendingUp} action={<ChartFilter filter={revenueFilter} onChange={updateRevenueFilter} onApply={refreshRevenueChart} />}>
                    {loading ? <LoadingBlock /> : <RevenueLineChart data={revenueChart} />}
                </Panel>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Panel title="Đơn hàng" icon={ShoppingCart}>
                    {loading ? <LoadingBlock /> : <OrdersBarChart data={ordersChart} />}
                </Panel>

                <Panel title="Lượt truy cập" icon={Eye}>
                    {loading ? <LoadingBlock /> : <TrafficLineChart data={trafficChart} />}
                </Panel>
            </section>

            <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <Panel title="Conversion Funnel" icon={TrendingUp}>
                    {loading ? <SmallLoading /> : <ConversionFunnel behavior={funnelBehavior || behavior} />}
                </Panel>

                <Panel title="Tỷ lệ hiệu suất" icon={Percent}>
                    {loading ? <LoadingBlock /> : <RadialRates metrics={rates} />}
                </Panel>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Panel title="Doanh thu theo danh mục" icon={BarChart3}>
                    {loading ? <LoadingBlock /> : <HorizontalBarChart data={categoryRevenue} valueKey="revenue" valueFormatter={formatMoney} />}
                </Panel>

                <Panel title="Top sản phẩm bán chạy" icon={Package}>
                    {loading ? <LoadingBlock /> : <HorizontalBarChart data={topProducts} valueKey="sold" valueFormatter={formatNumber} />}
                </Panel>
            </section>

            <Panel title="Sản phẩm xem nhiều" icon={Eye}>
                {loading ? <LoadingBlock /> : <HorizontalBarChart data={topViewedProducts} valueKey="views" valueFormatter={formatNumber} />}
            </Panel>

            <Panel title="Tổng hợp kỳ đang xem" icon={FileSpreadsheet}>
                <div className="grid gap-3 sm:grid-cols-3">
                    <InfoLine label="Doanh thu" value={formatMoney(computed.revenue)} />
                    <InfoLine label="Số đơn" value={formatNumber(computed.orders)} />
                    <InfoLine label="Trung bình / đơn" value={formatMoney(computed.average)} />
                </div>
            </Panel>
        </div>
    );
}

function paramsFromFilter(filter) {
    return {
        group_by: filter.groupBy,
        date_from: filter.dateFrom || undefined,
        date_to: filter.dateTo || undefined,
    };
}

function ChartFilter({ filter, onChange, onApply, showGroup = true }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <select className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900" value={filter.days} onChange={(e) => onChange('days', Number(e.target.value))}>
                {quickRanges.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            {showGroup ? (
                <select className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900" value={filter.groupBy} onChange={(e) => onChange('groupBy', e.target.value)}>
                    {groupOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
            ) : null}
            <input className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900" type="date" value={filter.dateFrom} onChange={(e) => onChange('dateFrom', e.target.value)} />
            <input className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900" type="date" value={filter.dateTo} onChange={(e) => onChange('dateTo', e.target.value)} />
            <button type="button" onClick={onApply} className="h-9 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white dark:bg-white dark:text-slate-900">Lọc</button>
        </div>
    );
}

function MetricCard({ label, tooltip, ...props }) {
    return <StatCard {...props} label={<MetricLabel label={label} tooltip={tooltip} />} />;
}

function MetricLabel({ label, tooltip }) {
    if (!tooltip) return label;
    return (
        <span className="group relative inline-flex items-center gap-1">
            <span>{label}</span>
            <Info size={13} className="text-current opacity-70" />
            <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs font-medium leading-5 text-slate-600 shadow-xl group-hover:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{tooltip}</span>
        </span>
    );
}

function Panel({ title, icon: Icon, action, children }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-center gap-2">
                    {Icon ? <Icon size={18} className="text-slate-500" /> : null}
                    <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function DonutChart({ data }) {
    return <ReactApexChart type="donut" height={280} series={data.map((item) => Number(item.value || 0))} options={{ labels: data.map((item) => item.label), colors: chartColors, legend: { position: 'bottom' }, dataLabels: { enabled: true }, stroke: { width: 0 } }} />;
}

function RevenueLineChart({ data }) {
    return <ReactApexChart type="line" height={330} series={[{ name: 'Doanh thu', data: data.map((item) => Number(item.revenue || 0)) }]} options={{ chart: { toolbar: { show: false }, zoom: { enabled: false } }, colors: ['#e11d48'], stroke: { curve: 'smooth', width: 3 }, xaxis: { categories: data.map((item) => item.label || item.date) }, yaxis: { labels: { formatter: (value) => formatShortMoney(value) } }, tooltip: { y: { formatter: (value) => formatMoney(value) } }, markers: { size: 3 } }} />;
}

function OrdersBarChart({ data }) {
    return <ReactApexChart type="bar" height={320} series={[{ name: 'Đơn hàng', data: data.map((item) => Number(item.ordersCount || 0)) }]} options={{ chart: { toolbar: { show: false } }, colors: ['#2563eb'], plotOptions: { bar: { borderRadius: 4, columnWidth: '48%' } }, xaxis: { categories: data.map((item) => item.label || item.date) }, yaxis: { labels: { formatter: (value) => formatNumber(value) } }, tooltip: { y: { formatter: (value) => `${formatNumber(value)} đơn` } } }} />;
}

function TrafficLineChart({ data }) {
    return <ReactApexChart type="line" height={320} series={[{ name: 'Visitor', data: data.map((item) => Number(item.visitors || 0)) }, { name: 'Page View', data: data.map((item) => Number(item.pageViews || 0)) }, { name: 'Product View', data: data.map((item) => Number(item.productViews || 0)) }]} options={{ chart: { toolbar: { show: false }, zoom: { enabled: false } }, colors: ['#2563eb', '#7c3aed', '#059669'], stroke: { curve: 'smooth', width: 3 }, xaxis: { categories: data.map((item) => item.label || item.date) }, yaxis: { labels: { formatter: (value) => formatNumber(value) } }, legend: { position: 'top' }, tooltip: { y: { formatter: (value) => formatNumber(value) } } }} />;
}

function ConversionFunnel({ behavior }) {
    const steps = [
        { label: 'Visitor', value: behavior?.visitors || 0, icon: Users, tone: 'blue' },
        { label: 'Page View', value: behavior?.pageViews || 0, icon: Eye, tone: 'violet' },
        { label: 'Product View', value: behavior?.productViews || 0, icon: Package, tone: 'emerald' },
        { label: 'Add To Cart', value: behavior?.addToCart || 0, icon: ShoppingCart, tone: 'amber' },
        { label: 'Checkout', value: behavior?.checkoutStarted || 0, icon: FileSpreadsheet, tone: 'rose' },
        { label: 'Purchase', value: behavior?.purchases || 0, icon: TrendingUp, tone: 'slate' },
    ];
    const max = Math.max(...steps.map((item) => Number(item.value || 0)), 1);
    const firstValue = Number(steps[0]?.value || 0);
    const lastValue = Number(steps[steps.length - 1]?.value || 0);
    const totalConversion = firstValue > 0 ? (lastValue / firstValue) * 100 : 0;

    return (
        <div className="space-y-2">
            {steps.map((item, index) => {
                const Icon = item.icon;
                const next = steps[index + 1];
                const width = Math.max(18, Math.round((Number(item.value || 0) / max) * 100));
                const conversion = next && Number(item.value || 0) > 0 ? (Number(next.value || 0) / Number(item.value || 0)) * 100 : 0;
                const dropOff = next ? Math.max(0, 100 - conversion) : 0;
                const tone = funnelToneClass(item.tone);

                return (
                    <div key={item.label} className="space-y-1">
                        <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex items-center gap-2">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
                                    <Icon size={16} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{item.label}</p>
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatNumber(item.value)}</p>
                                    </div>
                                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div className={`h-1.5 rounded-full ${tone.bar}`} style={{ width: `${width}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {next ? (
                            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <span className="text-slate-300">↓</span>
                                <span>CR {formatNumber(conversion)}%</span>
                                <span className="text-slate-300">•</span>
                                <span>Drop-off {formatNumber(dropOff)}%</span>
                            </div>
                        ) : null}
                    </div>
                );
            })}
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">Tỷ lệ chuyển đổi tổng</p>
                <p className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-200">{formatNumber(totalConversion)}%</p>
            </div>
        </div>
    );
}

function funnelToneClass(tone) {
    const tones = {
        blue: { icon: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300', bar: 'bg-blue-500' },
        violet: { icon: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300', bar: 'bg-violet-500' },
        emerald: { icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300', bar: 'bg-emerald-500' },
        amber: { icon: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300', bar: 'bg-amber-500' },
        rose: { icon: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300', bar: 'bg-rose-500' },
        slate: { icon: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200', bar: 'bg-slate-700' },
    };

    return tones[tone] || tones.slate;
}

function RadialRates({ metrics }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric, index) => (
                <div key={metric.label} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                    <MetricLabel label={metric.label} tooltip={metric.tooltip} />
                    <ReactApexChart type="radialBar" height={190} series={[Math.min(100, Number(metric.value || 0))]} options={{ colors: [chartColors[index % chartColors.length]], plotOptions: { radialBar: { hollow: { size: '58%' }, dataLabels: { name: { show: false }, value: { formatter: (value) => `${formatNumber(value)}%`, fontSize: '18px', fontWeight: 800 } } } }, stroke: { lineCap: 'round' } }} />
                </div>
            ))}
        </div>
    );
}

function HorizontalBarChart({ data, valueKey, valueFormatter }) {
    const names = data.map((item) => item.name || 'Không xác định');
    return <ReactApexChart type="bar" height={Math.max(280, data.length * 42)} series={[{ name: 'Giá trị', data: data.map((item) => Number(item[valueKey] || 0)) }]} options={{ chart: { toolbar: { show: false } }, colors: ['#0f172a'], plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '58%' } }, xaxis: { categories: names, labels: { formatter: (value) => valueFormatter(Number(value || 0)) } }, yaxis: { labels: { style: { fontWeight: 600 } } }, tooltip: { y: { formatter: (value) => valueFormatter(value) } }, dataLabels: { enabled: true, formatter: (value) => valueFormatter(value), style: { fontSize: '11px', fontWeight: 700 } } }} />;
}

function InfoLine({ label, value }) {
    return <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{value}</p></div>;
}

function LoadingBlock() {
    return <div className="flex h-72 items-center justify-center"><Loader2 size={24} className="animate-spin text-blue-600" /></div>;
}

function SmallLoading() {
    return <div className="flex h-52 items-center justify-center"><Loader2 size={22} className="animate-spin text-blue-600" /></div>;
}

function formatShortMoney(value) {
    const number = Number(value || 0);
    if (number >= 1000000) return `${formatNumber(Math.round(number / 1000000))}tr`;
    if (number >= 1000) return `${formatNumber(Math.round(number / 1000))}k`;
    return formatNumber(number);
}
