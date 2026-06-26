import {
    BadgePercent,
    Bell,
    CircleCheck,
    CircleX,
    CreditCard,
    Package,
    ShoppingBag,
    TicketPercent,
    Truck,
} from 'lucide-react';

const iconMap = {
    'shopping-bag': ShoppingBag,
    'credit-card': CreditCard,
    package: Package,
    truck: Truck,
    'circle-check': CircleCheck,
    'circle-x': CircleX,
    'ticket-percent': TicketPercent,
    'badge-percent': BadgePercent,
    bell: Bell,
};

const colorMap = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export default function NotificationIcon({
    icon = 'bell',
    color = 'blue',
    size = 20,
    className = 'h-12 w-12 rounded-xl',
}) {
    const Icon = iconMap[icon] || Bell;
    const colorClass = colorMap[color] || colorMap.blue;

    return (
        <span className={`flex shrink-0 items-center justify-center ${className} ${colorClass}`}>
            <Icon size={size} />
        </span>
    );
}