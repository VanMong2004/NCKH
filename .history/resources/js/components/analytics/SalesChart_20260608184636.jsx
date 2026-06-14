import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesChart({ data = [] }) {
    return (
        <section
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 min-w-0
overflow-hidden"
        >
            <div className="mb-5">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Chi tiêu theo tháng</h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Thống kê tổng số tiền đã thanh toán theo từng tháng.
                </p>
            </div>

            <div className="h-[250px] w-full min-w-0">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            barCategoryGap="25%"
                            margin={{
                                top: 10,
                                right: 5,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />

                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10 }}
                                tickFormatter={(value) => {
                                    const parts = String(value).split('-');

                                    return parts[1] || value;
                                }}
                            />

                            <YAxis
                                width={35}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10 }}
                                tickFormatter={(value) => {
                                    if (value >= 1000000) {
                                        return `${Math.round(value / 1000000)}tr`;
                                    }

                                    if (value >= 1000) {
                                        return `${Math.round(value / 1000)}k`;
                                    }

                                    return value;
                                }}
                            />

                            <Tooltip
                                formatter={(value) => [formatMoney(value), 'Chi tiêu']}
                                labelFormatter={(label) => {
                                    const parts = String(label).split('-');

                                    return `Tháng ${parts[1] || label}`;
                                }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '13px',
                                }}
                            />

                            <Bar dataKey="total" maxBarSize={50} radius={[8, 8, 0, 0]} fill="#1d4ed8" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        Chưa có dữ liệu chi tiêu
                    </div>
                )}
            </div>
        </section>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
