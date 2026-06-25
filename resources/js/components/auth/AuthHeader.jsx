import { Link } from 'react-router-dom';

export default function AuthHeader({ question, linkText, linkHref, siteContent }) {
    const navbar = siteContent?.navbar || {};
    const site = siteContent?.site || {};

    const logo = navbar.logo || site.logo || '/images/logo.png';
    const title = navbar.title || site.name || 'CTUT Shop';
    const subtitle = navbar.subtitle || site.tagline || 'Cùng nhau phát triển';

    console.log('AUTH HEADER:', siteContent);
    console.log('NAVBAR:', siteContent?.navbar);

    return (
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-3">
                    <img src={logo} alt={title} className="h-10 w-10 rounded object-cover" />

                    <div>
                        <h1 className="text-sm font-extrabold text-blue-950 dark:text-white md:text-lg">
                            {title}
                        </h1>
                        <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">
                            {subtitle}
                        </p>
                    </div>
                </Link>

                <div className="text-sm">
                    <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">
                        {question}
                    </span>

                    <Link to={linkHref} className="ml-2 font-bold text-blue-700 hover:text-blue-950 dark:text-blue-300">
                        {linkText}
                    </Link>
                </div>
            </div>
        </header>
    );
}