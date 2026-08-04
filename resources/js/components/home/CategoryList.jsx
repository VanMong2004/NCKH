import {
    BadgeIcon,
    CalendarDays,
    ChevronDown,
    Gift,
    Package,
    Shirt,
    ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

import SectionHeader from '../ui/SectionHeader';

export default function CategoryList({ categories = [] }) {
    const [openId, setOpenId] = useState(null);

    function toggleCategory(category) {
        const hasChildren = Array.isArray(category.children) && category.children.length > 0;

        if (!hasChildren) {
            return;
        }

        const key = category.id || category.slug || category.name;

        setOpenId((current) => (current === key ? null : key));
    }

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Danh mục" to="/shop" actionText="Tất cả" />

            {categories.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {categories.map((category, index) => {
                        const Icon = getCategoryIcon(category, index);
                        const key = category.id || category.slug || category.name;
                        const hasChildren = Array.isArray(category.children) && category.children.length > 0;
                        const isOpen = openId === key;

                        return (
                            <div
                                key={key}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition dark:border-slate-800 dark:bg-slate-950"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    className={[
                                        'group flex w-full flex-col items-center gap-3 p-4 text-center transition lg:flex-row lg:text-left',
                                        isOpen
                                            ? 'bg-blue-50 dark:bg-blue-500/10'
                                            : 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
                                    ].join(' ')}
                                >
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-950 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-300 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                                        <Icon size={21} />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="line-clamp-1 text-sm font-black text-blue-950 dark:text-white">
                                            {category.name}
                                        </span>

                                        <span className="mt-0.5 block text-xs font-semibold text-slate-400 dark:text-slate-500">
                                            {category.childrenCount || category.children?.length || 0} nhóm con
                                        </span>
                                    </span>

                                    {hasChildren && (
                                        <ChevronDown
                                            size={17}
                                            className={[
                                                'hidden text-slate-400 transition-transform duration-300 ease-in-out lg:block',
                                                isOpen ? 'rotate-180 text-blue-700 dark:text-blue-300' : '',
                                            ].join(' ')}
                                        />
                                    )}
                                </button>

                                {hasChildren && (
                                    <div
                                        className={[
                                            'overflow-hidden border-t border-slate-100 bg-slate-50 transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900/70',
                                            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                                        ].join(' ')}
                                    >
                                        <div
                                            className={[
                                                'p-2 transition-all duration-300 ease-in-out',
                                                isOpen ? 'translate-y-0' : '-translate-y-2',
                                            ].join(' ')}
                                        >
                                            <Link
                                                to={`/shop?category_id=${category.id}`}
                                                className="block rounded-xl px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-white dark:text-blue-300 dark:hover:bg-slate-950"
                                            >
                                                Tất cả {category.name}
                                            </Link>

                                            {category.children.map((child) => (
                                                <Link
                                                    key={child.id || child.slug || child.name}
                                                    to={child.id ? `/shop?category_id=${child.id}` : '/shop'}
                                                    className="block rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-950 dark:hover:text-blue-300"
                                                >
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
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
