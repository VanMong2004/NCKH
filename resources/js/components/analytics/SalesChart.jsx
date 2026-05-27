import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesChart({ data = [], days, onDaysChange }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-blue-950 dark:text-white">Doanh thu theo thời gian</h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi doanh thu trong {days} ngày gần nhất.
                    </p>
                </div>

                <select
                    value={days}
                    onChange={(e) => onDaysChange(Number(e.target.value))}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-blue-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                    <option value={7}>7 ngày</option>
                    <option value={30}>30 ngày</option>
                    <option value={90}>90 ngày</option>
                </select>
            </div>

            <div className="h-72">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={formatShortDate} />
                            <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                            <Tooltip
                                formatter={(value) => [formatMoney(value), 'Doanh thu']}
                                labelFormatter={(label) => `Ngày ${formatDate(label)}`}
                            />
                            <Area type="monotone" dataKey="revenue" strokeWidth={2} fillOpacity={0.25} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        Chưa có dữ liệu doanh thu
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

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
}

function formatShortDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return `${date.getDate()}/${date.getMonth() + 1}`;
}
