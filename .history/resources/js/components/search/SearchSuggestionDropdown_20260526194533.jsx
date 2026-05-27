import { Clock3, Loader2, Search, Star, Trash2 } from 'lucide-react';

export default function SearchSuggestionDropdown({
    suggestions = [],
    history = [],
    keyword = '',
    loading = false,
    isAuthenticated = false,
    onSelect,
    onDeleteHistory,
    onClearHistory,
}) {
    const hasKeyword = String(keyword || '').trim().length > 0;
    const hasSuggestions = suggestions.length > 0;
    const hasHistory = isAuthenticated && history.length > 0;

    return (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {hasKeyword ? (
                <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => onSelect(keyword)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-slate-800"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            <Search size={17} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-black text-blue-950 dark:text-white">Tìm kiếm “{keyword}”</p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">Xem kết quả trong cửa hàng</p>
                        </div>
                    </button>
                </div>
            ) : null}

            {loading ? (
                <div className="flex items-center gap-3 p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <Loader2 size={18} className="animate-spin text-blue-700 dark:text-blue-300" />
                    Đang tải gợi ý...
                </div>
            ) : hasSuggestions ? (
                <div className="p-3">
                    <p className="px-3 pb-2 text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Sản phẩm gợi ý
                    </p>

                    <div className="space-y-1">
                        {suggestions.map((item) => (
                            <button
                                key={item.id || item.slug || item.label}
                                type="button"
                                onClick={() => onSelect(item)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-slate-800"
                            >
                                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                                    <img
                                        src={item.image || '/images/no-image.png'}
                                        alt={item.label || item.name}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.src = '/images/no-image.png';
                                        }}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-1 text-sm font-black text-blue-950 dark:text-white">
                                        {item.label || item.name}
                                    </p>

                                    <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        <Star size={13} className="text-amber-400" />
                                        {item.rating > 0 ? item.rating : 'Chưa có đánh giá'}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : hasKeyword ? (
                <div className="p-5 text-sm text-slate-500 dark:text-slate-400">Không có sản phẩm gợi ý phù hợp.</div>
            ) : null}

            {!hasKeyword && hasHistory ? (
                <div className="p-3">
                    <div className="flex items-center justify-between gap-3 px-3 pb-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            Lịch sử tìm kiếm
                        </p>

                        <button
                            type="button"
                            onClick={onClearHistory}
                            className="text-xs font-bold text-red-500 transition hover:text-red-600"
                        >
                            Xóa tất cả
                        </button>
                    </div>

                    <div className="space-y-1">
                        {history.map((item) => (
                            <div
                                key={item.id || item.keyword}
                                className="group flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <button
                                    type="button"
                                    onClick={() => onSelect(item.keyword || item.label)}
                                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                    <Clock3 size={16} className="shrink-0 text-slate-400" />

                                    <span className="line-clamp-1 text-sm font-semibold text-blue-950 dark:text-white">
                                        {item.keyword || item.label}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onDeleteHistory(item.id)}
                                    className="rounded-lg p-1.5 text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-red-500/10"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {!hasKeyword && !hasHistory ? (
                <div className="p-5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            <Search size={18} />
                        </div>

                        <div>
                            <p className="font-black text-blue-950 dark:text-white">Tìm kiếm sản phẩm</p>

                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                Nhập ít nhất 2 ký tự để xem gợi ý. Lịch sử tìm kiếm chỉ hiển thị khi bạn đã đăng nhập.
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
