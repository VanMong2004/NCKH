import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

import AnalyticsSummaryCards from '../../components/analytics/AnalyticsSummaryCards';
import SalesChart from '../../components/analytics/SalesChart';
import TopProductsTable from '../../components/analytics/TopProductsTable';

import analyticsService

export default function AccountOverview() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    async function fetchAnalytics() {
        try {
            setLoading(true);
            setError('');

            const data = await userAnalyticsService.overview();

            setAnalytics(data);
        } catch (err) {
            console.error('User analytics error:', err);

            setError(err?.message || err?.response?.data?.message || 'Không thể tải thống kê cá nhân');
        } finally {
            setLoading(false);
        }
    }

    async function handleExportPdf() {
        try {
            setExporting('pdf');
            await userAnalyticsService.exportPdf();
        } catch (err) {
            console.error('Export PDF error:', err);
            alert('Không thể xuất PDF');
        } finally {
            setExporting('');
        }
    }

    async function handleExportExcel() {
        try {
            setExporting('excel');
            await userAnalyticsService.exportExcel();
        } catch (err) {
            console.error('Export Excel error:', err);
            alert('Không thể xuất Excel');
        } finally {
            setExporting('');
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[360px] items-center justify-center">
                <Loader2 className="animate-spin text-blue-950 dark:text-blue-300" size={34} />
            </div>
        );
    }

    if (error) {
        return (
            <section className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
                <h2 className="font-bold text-red-600 dark:text-red-300">Không thể tải thống kê</h2>

                <p className="mt-2 text-sm text-red-500 dark:text-red-300">{error}</p>

                <button
                    type="button"
                    onClick={fetchAnalytics}
                    className="mt-4 rounded-xl bg-red-600 px-5 py-3 font-bold text-white"
                >
                    Tải lại
                </button>
            </section>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">Tổng quan tài khoản</h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi đơn hàng, chi tiêu, campaign và sản phẩm bạn quan tâm.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        disabled={Boolean(exporting)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-blue-950 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                    >
                        {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        PDF
                    </button>

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={Boolean(exporting)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                        {exporting === 'excel' ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <FileSpreadsheet size={16} />
                        )}
                        Excel
                    </button>
                </div>
            </div>

            <AnalyticsSummaryCards analytics={analytics} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
                <SalesChart data={analytics.spending.monthlySpending} />

                <TopProductsTable products={analytics.interests.mostPurchasedProducts} />
            </div>

            <RecentOrders orders={analytics.orders.recentOrders} />
        </div>
    );
}

function RecentOrders({ orders = [] }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-blue-950 dark:text-white">Đơn hàng gần đây</h2>

            {orders.length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    Chưa có đơn hàng gần đây.
                </p>
            ) : (
                <div className="mt-4 space-y-3">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <p className="font-bold text-blue-950 dark:text-white">{order.orderCode}</p>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {order.updatedAt || 'Chưa cập nhật'}
                                </p>
                            </div>

                            <div className="text-left sm:text-right">
                                <p className="font-extrabold text-blue-950 dark:text-blue-300">
                                    {formatMoney(order.total)}
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    {order.statusText}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
