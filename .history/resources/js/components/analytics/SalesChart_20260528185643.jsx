import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesChart({ data = [] }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Chi tiêu theo tháng</h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Thống kê tổng số tiền đã thanh toán theo từng tháng.
                </p>
            </div>

            <div className="h-72">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                            <Tooltip
                                formatter={(value) => [formatMoney(value), 'Chi tiêu']}
                                labelFormatter={(label) => `Tháng ${label}`}
                            />
                            <Area type="monotone" dataKey="total" strokeWidth={2} fillOpacity={0.25} />
                        </AreaChart>
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
