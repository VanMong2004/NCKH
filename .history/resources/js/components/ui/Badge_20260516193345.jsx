export default function Badge({ children, variant = 'default' }) {
    const variants = {
        default: 'bg-slate-100 text-slate-600',
        hot: 'bg-red-500 text-white',
        new: 'bg-green-500 text-white',
        open: 'bg-green-500 text-white',
        upcoming: 'bg-orange-400 text-white',
    };

    return (
        <span className={`rounded-md px-2 py-1 text-xs font-bold ${variants[variant] || variants.default}`}>
            {children}
        </span>
    );
}
