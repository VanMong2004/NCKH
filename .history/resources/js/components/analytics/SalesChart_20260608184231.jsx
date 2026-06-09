import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesChart({ data = [] }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
                <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">Chi tiêu theo tháng</h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Thống kê tổng số tiền đã thanh toán theo từng tháng.
                </p>
            </div>

            <div className="h-[260px] sm:h-[320px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -15,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />

                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />

                            <YAxis
                                width={40}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11 }}
                                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                            />

                            <Tooltip
                                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                                formatter={(value) => [formatMoney(value), 'Chi tiêu']}
                                labelFormatter={(label) => `Tháng ${label}`}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                                }}
                            />

                            <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#1e40af" />
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

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
