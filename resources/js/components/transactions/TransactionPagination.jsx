import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TransactionPagination() {
    return (
        <section className="mt-6 hidden items-center justify-between md:flex">
            <p className="text-sm font-semibold text-blue-950">Showing 1 to 4 of 12 transactions</p>

            <div className="flex items-center gap-2">
                <PageButton>
                    <ChevronLeft size={16} />
                </PageButton>

                {[1, 2, 3].map((page) => (
                    <PageButton key={page} active={page === 1}>
                        {page}
                    </PageButton>
                ))}

                <PageButton>...</PageButton>

                <PageButton>
                    <ChevronRight size={16} />
                </PageButton>
            </div>

            <select className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>10 per page</option>
            </select>
        </section>
    );
}

function PageButton({ children, active = false }) {
    return (
        <button
            className={`flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-bold ${
                active ? 'border-blue-950 bg-blue-950 text-white' : 'border-slate-200 bg-white text-blue-950'
            }`}
        >
            {children}
        </button>
    );
}
