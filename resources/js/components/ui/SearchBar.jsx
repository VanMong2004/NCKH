import { Search } from 'lucide-react';

export default function SearchBar({ placeholder = 'Search...', className = '' }) {
    return (
        <div className={`flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
            <input type="text" placeholder={placeholder} className="min-w-0 flex-1 px-4 py-3 text-sm outline-none" />

            <button className="flex w-12 items-center justify-center bg-blue-950 text-white">
                <Search size={18} />
            </button>
        </div>
    );
}
