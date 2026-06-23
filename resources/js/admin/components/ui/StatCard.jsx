export default function StatCard({
    label,
    value,
    tone = 'blue',
    icon: Icon = null,
    desc = '',
    loading = false,
    className = '',
    iconClassName = '',
}) {
    const toneClass = {
        blue: {
            card: 'border-blue-100 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/10',
            value: 'text-blue-700 dark:text-blue-300',
            label: 'text-blue-700/70 dark:text-blue-200/70',
            icon: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
        },
        emerald: {
            card: 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10',
            value: 'text-emerald-700 dark:text-emerald-300',
            label: 'text-emerald-700/70 dark:text-emerald-200/70',
            icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        },
        green: {
            card: 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10',
            value: 'text-emerald-700 dark:text-emerald-300',
            label: 'text-emerald-700/70 dark:text-emerald-200/70',
            icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        },
        amber: {
            card: 'border-amber-100 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/10',
            value: 'text-amber-700 dark:text-amber-300',
            label: 'text-amber-700/70 dark:text-amber-200/70',
            icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        },
        violet: {
            card: 'border-violet-100 bg-violet-50/50 dark:border-violet-500/20 dark:bg-violet-500/10',
            value: 'text-violet-700 dark:text-violet-300',
            label: 'text-violet-700/70 dark:text-violet-200/70',
            icon: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
        },
        rose: {
            card: 'border-rose-100 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/10',
            value: 'text-rose-700 dark:text-rose-300',
            label: 'text-rose-700/70 dark:text-rose-200/70',
            icon: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
        },
        slate: {
            card: 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/60',
            value: 'text-slate-700 dark:text-slate-200',
            label: 'text-slate-500 dark:text-slate-400',
            icon: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        },
        gray: {
            card: 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/60',
            value: 'text-slate-700 dark:text-slate-200',
            label: 'text-slate-500 dark:text-slate-400',
            icon: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        },
    };

    const current = toneClass[tone] || toneClass.blue;

    return (
        <div className={`rounded-lg border p-4 ${current.card} ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className={`text-sm font-semibold ${current.label}`}>{label}</p>

                    {loading ? (
                        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-white/70 dark:bg-slate-700/70" />
                    ) : (
                        <p className={`mt-1 text-2xl font-extrabold ${current.value}`}>{value ?? 0}</p>
                    )}
                </div>

                {Icon ? (
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${current.icon}`}>
                        <StatIcon icon={Icon} iconClassName={iconClassName} />
                    </div>
                ) : null}
            </div>

            {desc ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{desc}</p> : null}
        </div>
    );
}

function StatIcon({ icon: Icon, iconClassName = '' }) {
    if (!Icon) return null;

    /**
     * Trường hợp truyền icon dạng JSX element:
     * icon={<ShoppingCart size={18} />}
     */
    if (Icon?.type) {
        return Icon;
    }

    /**
     * Trường hợp truyền icon dạng component:
     * icon={ShoppingCart}
     * icon={FileText}
     *
     * Lucide icon là forwardRef object, nên KHÔNG được render trực tiếp {Icon}.
     * Phải render qua JSX component động như bên dưới.
     */
    const IconComponent = Icon;

    return <IconComponent size={20} className={iconClassName} />;
}
