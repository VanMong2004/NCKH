import { Link } from 'react-router-dom';

export default function AuthHeader({ question, linkText, linkHref }) {
    return (
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-3">
                    <img src="/images/logo.png" alt="ABC University" className="h-10 w-10 rounded" />

                    <div>
                        <h1 className="text-sm font-extrabold text-blue-950 dark:text-white md:text-lg">
                            CTUT Shop
                        </h1>
                        <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">Together We Grow</p>
                    </div>
                </Link>

                <div className="text-sm">
                    <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">{question}</span>

                    <Link to={linkHref} className="ml-2 font-bold text-blue-700 hover:text-blue-950 dark:text-blue-300">
                        {linkText}
                    </Link>
                </div>
            </div>
        </header>
    );
}
