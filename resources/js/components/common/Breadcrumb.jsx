import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items, to }) {
    return (
        <nav className="w-full md:max-w-7xl mx-auto flex items-center gap-2 text-sm pt-2 ps-4">
            {items.map((item, index) => (
                <Link key={index} to={to[index]}>
                    <div className="flex items-center gap-2">
                        <span className={index === items.length - 1 ? 'text-title font-medium' : 'text-muted'}>
                            {item}
                        </span>
                        {index < items.length - 1 && <ChevronRight className="w-4 h-4 text-muted" />}
                    </div>
                </Link>
            ))}
        </nav>
    );
}
