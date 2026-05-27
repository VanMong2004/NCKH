import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SectionHeader({ title, to = '#', actionText = 'Xem tất cả', className = '' }) {
    return (
        <div className={`flex items-center justify-between gap-4 ${className}`}>
            <h2 className="text-xl font-black text-blue-950 dark:text-white">{title}</h2>

            {to && to !== '#' ? (
                <Link
                    to={to}
                    className="inline-flex items-center gap-1.5 text-sm font-black text-blue-700 transition hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
                >
                    {actionText}
                    <ArrowRight size={15} />
                </Link>
            ) : null}
        </div>
    );
}
