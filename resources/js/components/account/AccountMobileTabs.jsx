import { NavLink } from 'react-router-dom';

export default function AccountMobileTabs({ menus = [] }) {
    return (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {menus.map(({ label, mobileLabel, icon: Icon, path }) => (
                <NavLink
                    key={path}
                    to={path}
                    end={path === '/account/overview'}
                    className={({ isActive }) =>
                        `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                            isActive
                                ? 'bg-blue-950 text-white dark:bg-blue-700'
                                : 'border border-slate-200 bg-white text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                        }`
                    }
                >
                    <Icon size={16} />
                    {mobileLabel || label}
                </NavLink>
            ))}
        </div>
    );
}
