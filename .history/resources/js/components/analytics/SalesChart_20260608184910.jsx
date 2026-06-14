import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesChart({ data = [] }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Chi tiêu theo tháng</h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Thống kê tổng số tiền đã thanh toán theo từng tháng.
                </p>
            </div>

            {data.length === 0 ? (
                <div className="flex h-60 items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    Chưa có dữ liệu chi tiêu
                </div>
            ) : (
                <>
                    {/* Mobile */}
                    <div className="space-y-3 sm:hidden">
                        {data.map((item) => (
                            <div
                                key={item.month}
                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Tháng {getMonth(item.month)}
                                    </p>

                                    <p className="mt-1 font-bold text-blue-950 dark:text-white">
                                        {formatMoney(item.total)}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                    {getMonth(item.month)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop */}
                    <div className="hidden h-[340px] sm:block">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
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
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => getMonth(value)}
                                />

                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    width={60}
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
                                    labelFormatter={(label) => `Tháng ${getMonth(label)}`}
                                />

                                <Bar dataKey="total" fill="#1d4ed8" radius={[10, 10, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </section>
    );
}

function getMonth(value) {
    const parts = String(value).split('-');

    return parts[1] || value;
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
