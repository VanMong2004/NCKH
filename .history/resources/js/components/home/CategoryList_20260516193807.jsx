import { Badge as BadgeIcon, CalendarDays, Gift, Shirt, ShoppingBag } from 'lucide-react';

import SectionHeader from '../ui/SectionHeader';

const icons = [Shirt, ShoppingBag, BadgeIcon, CalendarDays, Gift, BadgeIcon];

export default function CategoryList({ categories }) {
    return (
        <section>
            <SectionHeader title="Categories" />

            <div className="grid grid-cols-4 gap-3 md:grid-cols-1">
                {categories.map((category, index) => {
                    const Icon = icons[index] || BadgeIcon;

                    return (
                        <button
                            key={category}
                            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center text-sm font-semibold text-blue-950 md:flex-row md:border-0 md:text-left"
                        >
                            <Icon size={20} />
                            <span>{category}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
