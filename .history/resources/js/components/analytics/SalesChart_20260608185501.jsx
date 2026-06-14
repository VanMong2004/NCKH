import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesChart({ data = [] }) {
    const chartData = data.map((item) => ({
        ...item,
        month: formatMonth(item.month),
    }));

    return (
        <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Chi tiêu theo tháng</h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Thống kê tổng số tiền đã thanh toán theo từng tháng.
                </p>
            </div>

            <div className="h-[260px] w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />

                            <XAxis
                                dataKey="month"
                                tick={{
                                    fontSize: 11,
                                }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <YAxis
                                width={45}
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
                                cursor={{
                                    fill: 'rgba(15,23,42,0.05)',
                                }}
                                contentStyle={{
                                    borderRadius: 12,
                                    border: 'none',
                                    boxShadow: '0 10px 30px rgba(0,0,0,.12)',
                                }}
                                formatter={(value) => [formatMoney(value), 'Chi tiêu']}
                                labelFormatter={(label) => `Tháng ${label}`}
                            />

                            <Bar dataKey="total" radius={[10, 10, 0, 0]} />
                        </BarChart>
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

    return parts[1];
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
