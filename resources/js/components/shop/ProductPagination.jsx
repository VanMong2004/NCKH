export default function ProductPagination({ meta, onPageChange }) {
    if (!meta) return null;

    const current = Number(meta.currentPage || 1);
    const last = Number(meta.lastPage || 1);
    const pages = buildPages(current, last);

    if (last <= 1) {
        return null;
    }

    return (
        <div className="mt-8 flex flex-col items-center gap-3">
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Trang <span className="text-blue-950 dark:text-blue-300">{current}</span> / {last}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
                <PageButton disabled={current <= 1} onClick={() => onPageChange(current - 1)}>
                    Trước
                </PageButton>

                {pages.map((page, index) =>
                    page === '...' ? (
                        <span key={`dots-${index}`} className="px-1 text-slate-400 dark:text-slate-600">
                            ...
                        </span>
                    ) : (
                        <PageButton key={page} active={page === current} onClick={() => onPageChange(page)}>
                            {page}
                        </PageButton>
                    ),
                )}

                <PageButton disabled={current >= last} onClick={() => onPageChange(current + 1)}>
                    Sau
                </PageButton>
            </div>
        </div>
    );
}

function PageButton({ children, active = false, disabled = false, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                    ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-600 dark:bg-blue-600'
                    : 'border-slate-300 bg-white text-blue-950 hover:border-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500'
            }`}
        >
            {children}
        </button>
    );
}

function buildPages(current, last) {
    if (last <= 5) {
        return Array.from({ length: last }, (_, index) => index + 1);
    }

    if (current <= 3) {
        return [1, 2, 3, 4, '...', last];
    }

    if (current >= last - 2) {
        return [1, '...', last - 3, last - 2, last - 1, last];
    }

    return [1, '...', current - 1, current, current + 1, '...', last];
}
