import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesChart({ data = [] }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">Chi tiêu theo tháng</h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Thống kê tổng số tiền đã thanh toán theo từng tháng.
                    </p>
                </div>
            </div>

            <div className="h-[320px] sm:h-[360px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#1e40af" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#1e40af" stopOpacity={0.03} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#cbd5e1" />

                            <XAxis dataKey="month" tickLine={false} axisLine={false} />

                            <YAxis
                                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                                tickLine={false}
                                axisLine={false}
                            />

                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                                }}
                                formatter={(value) => [formatMoney(value), 'Chi tiêu']}
                                labelFormatter={(label) => `Tháng ${label}`}
                            />

                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#1e40af"
                                strokeWidth={3}
                                fill="url(#spendingGradient)"
                            />
                        </AreaChart>
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

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
