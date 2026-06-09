import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesChart({ data = [] }) {
    const chartData = data.map((item) => ({
        ...item,
        monthLabel: formatMonth(item.month),
    }));

    const totalSpent = chartData.reduce((sum, item) => sum + Number(item.total || 0), 0);

    return (
        <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Chi tiêu theo tháng</h2>

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

            <div className="mt-6 h-[280px] w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />

                            <XAxis
                                dataKey="monthLabel"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fontSize: 12,
                                }}
                            />

                            <YAxis
                                width={55}
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fontSize: 11,
                                }}
                                tickFormatter={(value) => {
                                    if (value >= 1000000) {
                                        return `${(value / 1000000).toFixed(1)}M`;
                                    }

                                    if (value >= 1000) {
                                        return `${Math.round(value / 1000)}K`;
                                    }

                                    return value;
                                }}
                            />

                            <Tooltip
                                contentStyle={{
                                    borderRadius: 12,
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                }}
                                formatter={(value) => [formatMoney(value), 'Chi tiêu']}
                            />

                            <Line
                                type="monotone"
                                dataKey="total"
                                strokeWidth={3}
                                dot={{
                                    r: 5,
                                }}
                                activeDot={{
                                    r: 7,
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
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

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
