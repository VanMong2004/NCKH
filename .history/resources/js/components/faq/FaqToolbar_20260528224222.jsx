import {
    ArrowRight,
    CreditCard,
    HelpCircle,
    Loader2,
    PackageCheck,
    Search,
    ShieldCheck,
    Sparkles,
    Tag,
    UserRound,
    X,
} from 'lucide-react';
import { useMemo } from 'react';

export default function FaqToolbar({
    categories = [],
    activeCategory = '',
    keyword = '',
    loading = false,
    onCategoryChange,
    onKeywordChange,
    onSearch,
    onClearSearch,
}) {
    const tabs = useMemo(() => {
        return [
            {
                value: '',
                label: 'Tất cả',
                icon: Sparkles,
            },
            ...categories.map((category) => ({
                value: category,
                label: getCategoryLabel(category),
                icon: getCategoryIcon(category),
            })),
        ];
    }, [categories]);

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
                    {loading ? (
                        <div className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-5 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            <Loader2 size={16} className="animate-spin" />
                            Đang tải
                        </div>
                    ) : (
                        tabs.map((tab) => (
                            <CategoryTab
                                key={tab.value || 'all'}
                                tab={tab}
                                active={activeCategory === tab.value}
                                onClick={() => onCategoryChange(tab.value)}
                            />
                        ))
                    )}
                </div>

                <form onSubmit={onSearch} className="relative min-w-0 xl:w-[360px]">
                    <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                        value={keyword}
                        onChange={(e) => onKeywordChange(e.target.value)}
                        placeholder="Tìm kiếm câu hỏi..."
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/10"
                    />

                    {keyword ? (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            <X size={15} />
                        </button>
                    ) : null}

                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-blue-950 text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        <ArrowRight size={16} />
                    </button>
                </form>
            </div>
        </section>
    );
}

function CategoryTab({ tab, active, onClick }) {
    const Icon = tab.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-5 text-sm font-bold transition',
                active
                    ? 'border-blue-950 bg-blue-950 text-white shadow-md shadow-blue-950/20 dark:border-blue-500 dark:bg-blue-600'
                    : 'border-slate-200 bg-white text-blue-950 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-blue-500/40 dark:hover:bg-slate-800',
            ].join(' ')}
        >
            <Icon size={16} />
            {tab.label}
        </button>
    );
}

function getCategoryIcon(category) {
    const value = normalizeText(category);

    if (value.includes('don hang') || value.includes('order')) return PackageCheck;
    if (value.includes('thanh toan') || value.includes('payment')) return CreditCard;
    if (value.includes('chien dich') || value.includes('campaign')) return Tag;
    if (value.includes('tai khoan') || value.includes('account')) return UserRound;
    if (value.includes('bao mat') || value.includes('security')) return ShieldCheck;

    return HelpCircle;
}

function getCategoryLabel(category) {
    const value = String(category || '').trim();

    if (!value) return 'Chung';

    const normalized = normalizeText(value);

    if (normalized.includes('chung') || normalized.includes('general')) return 'Chung';
    if (normalized.includes('don hang') || normalized.includes('order')) return 'Đơn hàng';
    if (normalized.includes('thanh toan') || normalized.includes('payment')) return 'Thanh toán';
    if (normalized.includes('chien dich') || normalized.includes('campaign')) return 'Chiến dịch';
    if (normalized.includes('tai khoan') || normalized.includes('account')) return 'Tài khoản';
    if (normalized.includes('thong bao') || normalized.includes('notification')) return 'Thông báo';
    if (normalized.includes('nhan hang') || normalized.includes('pickup')) return 'Nhận hàng';
    if (normalized.includes('review') || normalized.includes('')) return 'Đánh giá';

    return value.replaceAll('-', ' ').replaceAll('_', ' ').replace(/\s+/g, ' ').trim();
}

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replaceAll('-', ' ')
        .replaceAll('_', ' ')
        .trim();
}
