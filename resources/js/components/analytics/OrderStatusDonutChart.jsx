import Chart from 'react-apexcharts';
import { PieChart } from 'lucide-react';

export default function OrderStatusDonutChart({ data = [] }) {
    const chartData = data.filter((item) => Number(item.total || 0) > 0);

    const options = {
        chart: { type: 'donut', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        colors: ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444', '#64748b'],
        labels: chartData.map((item) => item.statusText || item.status || 'Khác'),
        legend: { position: 'bottom', fontSize: '12px', fontWeight: 700, labels: { colors: '#64748b' } },
        stroke: { width: 3, colors: ['#fff'] },
        plotOptions: {
            pie: {
                donut: {
                    size: '68%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Tổng',
                            formatter: () => chartData.reduce((sum, item) => sum + Number(item.total || 0), 0),
                        },
                    },
                },
            },
        },
        dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 800 } },
        tooltip: { theme: 'light', y: { formatter: (value) => `${Number(value || 0)} đơn` } },
    };

    const series = chartData.map((item) => Number(item.total || 0));

    return (
        <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Phân bổ trạng thái đơn hàng</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tỷ lệ đơn hàng theo từng trạng thái xử lý.</p>
            </div>

            <div className="mt-5 h-[320px] w-full">
                {chartData.length > 0 ? (
                    <Chart options={options} series={series} type="donut" height="100%" />
                ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-center dark:bg-slate-950">
                        <div>
                            <PieChart size={40} className="mx-auto text-blue-950 dark:text-blue-300" />
                            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                Chưa có dữ liệu trạng thái đơn hàng.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
