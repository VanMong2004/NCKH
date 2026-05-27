export default function Badge({ children, variant = 'default' }) {
    const variants = {
        default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        hot: 'bg-red-500 text-white',
        new: 'bg-emerald-500 text-white',
        open: 'bg-emerald-500 text-white',
        upcoming: 'bg-orange-400 text-white',
    };

    return (
        <span
            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide shadow-sm ${variants[variant] || variants.default}`}
        >
            {children}
        </span>
    );
}
