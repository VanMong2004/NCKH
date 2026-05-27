import { SlidersHorizontal } from 'lucide-react';

const statuses = [
    { value: '', label: 'Tất cả' },
    { value: 'active', label: 'Đang mở', dot: 'bg-green-500' },
    { value: 'upcoming', label: 'Sắp mở', dot: 'bg-orange-400' },
    { value: 'ended', label: 'Đã kết thúc', dot: 'bg-slate-400' },
];

export default function CampaignFilters({ status, sort, onChange }) {
    return (
        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
                {statuses.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => onChange({ status: item.value })}
                        className={`min-w-max rounded-lg border px-4 py-2 text-sm font-bold ${
                            status === item.value
                                ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-700 dark:bg-blue-700'
                                : 'border-slate-200 bg-white text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                        }`}
                    >
                        {item.dot && <span className={`mr-2 inline-block h-2 w-2 rounded-full ${item.dot}`} />}
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Sắp xếp:</span>

                <select
                    value={sort}
                    onChange={(e) => onChange({ sort: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white md:w-44"
                >
                    <option value="">Mới nhất</option>
                    <option value="popular">Phổ biến</option>
                    <option value="ending_soon">Sắp kết thúc</option>
                </select>

                <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white p-3 text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white md:hidden"
                >
                    <SlidersHorizontal size={18} />
                </button>
            </div>
        </section>
    );
}
