import Chart from 'react-apexcharts';

export default function SalesChart({ data = [] }) {
    const chartData = data.map((item) => ({
        month: formatMonth(item.month),
        total: Number(item.total || 0),
    }));

    const totalSpent = chartData.reduce((sum, item) => sum + item.total, 0);

    const options = {
        chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif' },
        colors: ['#2563eb'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 4 },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.04, stops: [0, 90, 100] },
        },
        xaxis: {
            categories: chartData.map((item) => item.month),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#64748b', fontSize: '12px', fontWeight: 700 } },
        },
        yaxis: {
            labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 }, formatter: formatCompactMoney },
        },
        tooltip: { theme: 'light', y: { formatter: formatMoney } },
    };

    const series = [
        {
            name: 'Chi tiêu',
            data: chartData.map((item) => item.total),
        },
    ];

    return (
        <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Chi tiêu chi tiết theo tháng</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Theo dõi xu hướng chi tiêu của bạn theo thời gian.
                </p>

                <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tổng chi tiêu</p>
                    <p className="mt-1 text-2xl font-extrabold text-blue-950 dark:text-white">
                        {formatMoney(totalSpent)}
                    </p>
                </div>
            </div>

            <div className="mt-5 h-[300px] w-full">
                {chartData.length > 0 ? (
                    <Chart options={options} series={series} type="area" height="100%" />
                ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        Chưa có dữ liệu chi tiêu
                    </div>
                )}
            </div>
        </section>
    );
}

function formatMonth(value) {
    if (!value) return '';

    const parts = String(value).split('-');

    if (parts.length < 2) return value;

    return `Th${Number(parts[1])}`;
}

function formatCompactMoney(value) {
    const number = Number(value || 0);

    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (number >= 1000) return `${Math.round(number / 1000)}K`;

    return number;
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
