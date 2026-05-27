import { Download, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import analyticsService from '../../services/analyticsService';

import AnalyticsSummaryCards from '../../components/analytics/AnalyticsSummaryCards';
import SalesChart from '../../components/analytics/SalesChart';
import TopProductsTable from '../../components/analytics/TopProductsTable';

export default function AccountOverview() {
    const [overview, setOverview] = useState({
        totalOrders: 0,
        paidOrders: 0,
        revenue: 0,
        totalUsers: 0,
    });

    const [topProducts, setTopProducts] = useState([]);
    const [salesChart, setSalesChart] = useState([]);

    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        loadSalesChart();
    }, [days]);

    async function loadDashboard() {
        try {
            setLoading(true);

            const [overviewData, topProductsData, salesChartData] = await Promise.all([
                analyticsService.overview(),
                analyticsService.topProducts(),
                analyticsService.salesChart(days),
            ]);

            setOverview(overviewData);
            setTopProducts(topProductsData);
            setSalesChart(salesChartData);
        } catch (error) {
            toast.error(error.message || 'Không thể tải dữ liệu tổng quan');
        } finally {
            setLoading(false);
        }
    }

    async function loadSalesChart() {
        try {
            const data = await analyticsService.salesChart(days);
            setSalesChart(data);
        } catch {
            setSalesChart([]);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Tổng quan tài khoản</h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi nhanh đơn hàng, doanh thu và sản phẩm nổi bật.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={loadDashboard}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-blue-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Tải lại
                    </button>

                    <a
                        href={analyticsService.exportExcelUrl()}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-900 dark:bg-blue-700"
                    >
                        <Download size={16} />
                        Excel
                    </a>

                    <a
                        href={analyticsService.exportPdfUrl()}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                    >
                        <Download size={16} />
                        PDF
                    </a>
                </div>
            </div>

            <AnalyticsSummaryCards overview={overview} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
                <SalesChart data={salesChart} days={days} onDaysChange={setDays} />

                <TopProductsTable products={topProducts} />
            </div>
        </div>
    );
}
