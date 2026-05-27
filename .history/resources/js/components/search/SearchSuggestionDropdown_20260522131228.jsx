import { Clock, Search, X } from 'lucide-react';

export default function SearchSuggestionDropdown({
    suggestions = [],
    history = [],
    keyword = '',
    loading = false,
    onSelect,
    onDeleteHistory,
    onClearHistory,
}) {
    const hasKeyword = keyword.trim().length > 0;
    const hasSuggestions = suggestions.length > 0;
    const hasHistory = history.length > 0;

    if (!hasKeyword && !hasHistory) return null;

    return (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {loading && (
                <div className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Đang tìm gợi ý...</div>
            )}

            {!loading && hasKeyword && (
                <div>
                    <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-400 dark:border-slate-800">
                        Gợi ý tìm kiếm
                    </div>

                    {hasSuggestions ? (
                        suggestions.map((item, index) => (
                            <button
                                key={item.id || item.slug || item.keyword || index}
                                type="button"
                                onClick={() => onSelect(item.keyword || item.name || item.title || item)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-blue-950 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
                            >
                                <Search size={16} className="text-slate-400" />
                                <span className="line-clamp-1">{item.keyword || item.name || item.title || item}</span>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                            Không có gợi ý phù hợp.
                        </div>
                    )}
                </div>
            )}

            {!hasKeyword && hasHistory && (
                <div>
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase text-slate-400">Tìm kiếm gần đây</span>

                        <button type="button" onClick={onClearHistory} className="text-xs font-bold text-red-500">
                            Xóa tất cả
                        </button>
                    </div>

                    {history.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <button
                                type="button"
                                onClick={() => onSelect(item.keyword)}
                                className="flex min-w-0 flex-1 items-center gap-3 text-left text-sm font-semibold text-blue-950 dark:text-white"
                            >
                                <Clock size={16} className="text-slate-400" />
                                <span className="truncate">{item.keyword}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onDeleteHistory(item.id)}
                                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
