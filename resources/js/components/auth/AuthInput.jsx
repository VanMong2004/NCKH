export default function AuthInput({ label, icon, error, className = '', ...props }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">{label}</span>

            <div
                className={`flex h-12 items-center gap-3 rounded-xl border bg-white px-3 dark:bg-slate-950 ${
                    error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                } ${className}`}
            >
                <span className="text-slate-400">{icon}</span>

                <input
                    {...props}
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                />
            </div>

            {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
        </label>
    );
}
