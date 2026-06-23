import Chart from 'react-apexcharts';
import { PackageSearch } from 'lucide-react';

export default function TopProductsChart({ products = [] }) {
    const chartData = products.slice(0, 6).map((item) => ({
        name: item.name || 'Sản phẩm',
        quantity: Number(item.totalQuantity || 0),
    }));

    const options = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        colors: ['#0ea5e9'],
        plotOptions: { bar: { horizontal: true, borderRadius: 8, barHeight: '56%', distributed: true } },
        dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 800, colors: ['#fff'] } },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
        xaxis: {
            categories: chartData.map((item) => shortenName(item.name)),
            labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 } },
        },
        yaxis: { labels: { style: { colors: '#334155', fontSize: '12px', fontWeight: 700 } } },
        tooltip: { theme: 'light', y: { formatter: (value) => `${Number(value || 0)} sản phẩm` } },
        legend: { show: false },
    };

    const series = [
        {
            name: 'Đã mua',
            data: chartData.map((item) => item.quantity),
        },
    ];

    return (
        <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Sản phẩm mua nhiều nhất</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Biểu đồ các sản phẩm bạn đã mua với số lượng cao nhất.
                </p>
            </div>

            <div className="mt-5 h-[320px] w-full">
                {chartData.length > 0 ? (
                    <Chart options={options} series={series} type="bar" height="100%" />
                ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-center dark:bg-slate-950">
                        <div>
                            <PackageSearch size={40} className="mx-auto text-blue-950 dark:text-blue-300" />
                            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                Chưa có dữ liệu sản phẩm.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function shortenName(value) {
    const text = String(value || '');

    if (text.length <= 18) return text;

    return `${text.slice(0, 18)}...`;
}
