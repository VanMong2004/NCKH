import { ListFilter, Search } from 'lucide-react';

export default function ProductToolbar({ filters, onChange, onSearch, onOpenFilter, total = 0 }) {
    return (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <form onSubmit={onSearch} className="space-y-3">
                <div className="flex h-11 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:border-blue-400 sm:h-12">
                    <input
                        value={filters.keyword}
                        onChange={(e) => onChange('keyword', e.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                    />

                    <button
                        type="submit"
                        className="flex w-12 items-center justify-center bg-blue-950 text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 sm:w-14"
                        aria-label="Tìm kiếm"
                    >
                        <Search size={19} />
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onOpenFilter}
                        className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 md:hidden"
                    >
                        <ListFilter size={17} />
                        Bộ lọc
                    </button>

                    <select
                        value={filters.sort}
                        onChange={(e) => onChange('sort', e.target.value)}
                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="popular">Phổ biến</option>
                        <option value="best_selling">Bán chạy</option>
                        <option value="rating">Đánh giá cao</option>
                        <option value="price_asc">Giá thấp đến cao</option>
                        <option value="price_desc">Giá cao đến thấp</option>
                    </select>

                    <select
                        value={filters.per_page}
                        onChange={(e) => onChange('per_page', Number(e.target.value))}
                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                        <option value={12}>12 / trang</option>
                        <option value={24}>24 / trang</option>
                        <option value={48}>48 / trang</option>
                    </select>

                    <span className="ml-auto hidden text-sm font-semibold text-slate-500 dark:text-slate-400 sm:block">
                        {total} sản phẩm
                    </span>
                </div>
            </form>
        </div>
    );
}
