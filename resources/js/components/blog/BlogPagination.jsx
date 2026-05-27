import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BlogPagination({ meta, onPageChange }) {
    const currentPage = Number(meta.currentPage || 1);
    const lastPage = Number(meta.lastPage || 1);

    return (
        <div className="flex flex-col items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Trang <span className="font-black text-blue-950 dark:text-white">{currentPage}</span> / {lastPage}
            </p>

            <div className="flex items-center gap-2">
                <PageButton disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
                    <ChevronLeft size={16} />
                    Trước
                </PageButton>

                <PageButton disabled={currentPage >= lastPage} onClick={() => onPageChange(currentPage + 1)}>
                    Sau
                    <ChevronRight size={16} />
                </PageButton>
            </div>
        </div>
    );
}

function PageButton({ children, disabled, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-blue-950 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-blue-500/40 dark:hover:bg-slate-800"
        >
            {children}
        </button>
    );
}
