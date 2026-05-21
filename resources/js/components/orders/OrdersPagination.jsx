export default function OrdersPagination({ meta, onPageChange }) {
    if (!meta || meta.lastPage <= 1) return null;

    return (
        <div className="mt-8 flex justify-center gap-2">
            <PageButton disabled={meta.currentPage <= 1} onClick={() => onPageChange(meta.currentPage - 1)}>
                Trước
            </PageButton>

            {Array.from({ length: meta.lastPage }).map((_, index) => {
                const page = index + 1;

                return (
                    <PageButton key={page} active={page === meta.currentPage} onClick={() => onPageChange(page)}>
                        {page}
                    </PageButton>
                );
            })}

            <PageButton disabled={meta.currentPage >= meta.lastPage} onClick={() => onPageChange(meta.currentPage + 1)}>
                Sau
            </PageButton>
        </div>
    );
}

function PageButton({ children, active = false, disabled = false, onClick }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-bold disabled:opacity-40 ${
                active ? 'border-blue-950 bg-blue-950 text-white' : 'border-slate-200 bg-white text-blue-950'
            }`}
        >
            {children}
        </button>
    );
}
