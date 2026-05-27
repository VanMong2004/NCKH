import { Badge as BadgeIcon, CalendarDays, Gift, Package, Shirt, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

import SectionHeader from '../ui/SectionHeader';

export default function CategoryList({ categories = [] }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Danh mục" to="/shop" actionText="Tất cả" />

            {categories.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {categories.map((category, index) => {
                        const Icon = getCategoryIcon(category, index);

                        return (
                            <Link
                                key={category.id || category.slug || category.name}
                                to={category.id ? `/shop?category_id=${category.id}` : '/shop'}
                                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 lg:flex-row lg:text-left"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-950 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-300 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                                    <Icon size={21} />
                                </span>

                                <span className="min-w-0">
                                    <span className="line-clamp-1 text-sm font-black text-blue-950 dark:text-white">
                                        {category.name}
                                    </span>

                                    <span className="mt-0.5 block text-xs font-semibold text-slate-400 dark:text-slate-500">
                                        {category.childrenCount || 0} nhóm con
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Chưa có danh mục.</p>
                </div>
            )}
        </section>
    );
}

function getCategoryIcon(category, index) {
    const name = String(category?.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (name.includes('ao') || name.includes('dong phuc')) return Shirt;
    if (name.includes('phu kien')) return ShoppingBag;
    if (name.includes('bang ten')) return BadgeIcon;
    if (name.includes('su kien')) return CalendarDays;
    if (name.includes('qua') || name.includes('gift')) return Gift;

    const icons = [Shirt, ShoppingBag, BadgeIcon, CalendarDays, Gift, Package];

    return icons[index % icons.length] || Package;
}
