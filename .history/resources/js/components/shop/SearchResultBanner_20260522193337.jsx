import { Search, X } from 'lucide-react';

export default function SearchResultBanner({ keyword = '', total = 0, onClear }) {
    if (!keyword) return null;

    return (
        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-900">
                        <Search size={18} />
                    </div>

                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Kết quả tìm kiếm</p>

                        <h3 className="font-bold text-blue-950 dark:text-white">"{keyword}"</h3>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tìm thấy {total} sản phẩm</p>
                    </div>
                </div>

                <button
                    onClick={onClear}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-50 dark:bg-slate-900"
                >
                    <X size={16} />
                    Xóa tìm kiếm
                </button>
            </div>
        </div>
    );
}
