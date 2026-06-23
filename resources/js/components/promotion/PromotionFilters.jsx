import { Search, SlidersHorizontal } from 'lucide-react';

const statuses = [
    { value: '', label: 'Tất cả' },
    { value: 'active', label: 'Đang diễn ra', dot: 'bg-emerald-500' },
    { value: 'ending_soon', label: 'Sắp kết thúc', dot: 'bg-amber-400' },
    { value: 'upcoming', label: 'Sắp diễn ra', dot: 'bg-orange-400' },
    { value: 'ended', label: 'Đã kết thúc', dot: 'bg-slate-400' },
];

export default function PromotionFilters({ filters, onChange }) {
    return (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4 grid-cols-[minmax(0,1fr)_100px]">
                <div className="flex h-12 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-950 dark:border-slate-700 dark:bg-slate-950">
                    <input
                        value={filters.keyword}
                        onChange={(e) => onChange({ keyword: e.target.value })}
                        placeholder="Tìm đợt khuyến mãi..."
                        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-slate-800 outline-none dark:text-white"
                    />  

                    <div className="flex w-12 items-center justify-center text-slate-400">
                        <Search size={18} />
                    </div>
                </div>

                <select
                    value={filters.sort}
                    onChange={(e) => onChange({ sort: e.target.value })}
                    className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                    <option value="latest">Mới nhất</option>
                    <option value="popular">Phổ biến</option>
                </select>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {statuses.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => onChange({ status: item.value })}
                        className={[
                            'min-w-max rounded-xl border px-4 py-2 text-sm font-bold transition',
                            filters.status === item.value
                                ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-700 dark:bg-blue-700'
                                : 'border-slate-200 bg-white text-blue-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800',
                        ].join(' ')}
                    >
                        {item.dot && <span className={`mr-2 inline-block h-2 w-2 rounded-full ${item.dot}`} />}
                        {item.label}
                    </button>
                ))}

                <button
                    type="button"
                    className="ml-auto hidden rounded-xl border border-slate-200 bg-white p-2.5 text-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white md:block"
                    title="Bộ lọc"
                >
                    <SlidersHorizontal size={18} />
                </button>
            </div>
        </section>
    );
}
