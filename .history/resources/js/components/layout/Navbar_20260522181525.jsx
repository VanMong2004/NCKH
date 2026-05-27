import { Bell, ChevronDown, LogOut, Menu, Moon, Search, ShoppingCart, Sun, User, X } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';

import notificationService from '../../services/notificationService';
import searchService from '../../services/searchService';

import NotificationDropdown from '../notifications/NotificationDropdown';
import SearchSuggestionDropdown from '../search/SearchSuggestionDropdown';

export default function Navbar() {
    const navigate = useNavigate();

    const searchRef = useRef(null);

    const { user, logout } = useAuth();

    const { totalItems } = useCart();

    const { theme, toggleTheme } = useTheme();

    const [keyword, setKeyword] = useState('');

    const [suggestions, setSuggestions] = useState([]);

    const [searchHistory, setSearchHistory] = useState([]);

    const [searchLoading, setSearchLoading] = useState(false);

    const [openSearch, setOpenSearch] = useState(false);

    const [openMobileMenu, setOpenMobileMenu] = useState(false);

    const [openMobileSearch, setOpenMobileSearch] = useState(false);

    const [openUserMenu, setOpenUserMenu] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadUnread();
        loadSearchHistory();
    }, []);

    useEffect(() => {
        const value = keyword.trim();

        if (!value) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(() => {
            loadSuggestions(value);
        }, 300);

        return () => clearTimeout(timer);
    }, [keyword]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setOpenSearch(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    async function loadUnread() {
        try {
            const count = await notificationService.getUnreadCount();

            setUnreadCount(count);
        } catch {}
    }

    async function loadSuggestions(value) {
        try {
            setSearchLoading(true);

            const data = await searchService.suggestions(value);

            setSuggestions(data);
        } catch {
            setSuggestions([]);
        } finally {
            setSearchLoading(false);
        }
    }

    async function loadSearchHistory() {
        try {
            const data = await searchService.history();

            setSearchHistory(data);
        } catch {
            setSearchHistory([]);
        }
    }

    function goSearch(value) {
        const text = String(value || '').trim();

        if (!text) return;

        setKeyword(text);

        setOpenSearch(false);

        setOpenMobileMenu(false);

        setOpenMobileSearch(false);

        navigate(`/shop?keyword=${encodeURIComponent(text)}`);
    }

    async function handleDeleteHistory(id) {
        await searchService.deleteHistory(id);

        await loadSearchHistory();
    }

    async function handleClearHistory() {
        await searchService.clearHistory();

        setSearchHistory([]);
    }

    function handleSearch(e) {
        e.preventDefault();

        goSearch(keyword);
    }

    async function handleLogout() {
        await logout();

        setOpenUserMenu(false);

        navigate('/login');
    }

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex h-16 items-center justify-between gap-4 md:h-20">
                    <button
                        type="button"
                        onClick={() => setOpenMobileMenu(true)}
                        className="text-blue-950 dark:text-white md:hidden"
                    >
                        <Menu size={22} />
                    </button>

                    <Link to="/" className="flex shrink-0 items-center gap-3">
                        <img src="/images/logo.png" alt="CTUT" className="h-9 w-9 rounded" />

                        <div>
                            <h1 className="text-sm font-bold text-blue-950 dark:text-white md:text-lg">CTUT Shop</h1>

                            <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">
                                Cùng nhau phát triển
                            </p>
                        </div>
                    </Link>

                    <form ref={searchRef} onSubmit={handleSearch} className="relative hidden max-w-xl flex-1 md:block">
                        <div className="flex h-10 overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                            <input
                                value={keyword}
                                onFocus={() => setOpenSearch(true)}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Tìm sản phẩm, chiến dịch..."
                                className="min-w-0 flex-1 px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:bg-slate-900 dark:text-white"
                            />

                            <button
                                type="submit"
                                className="flex w-12 items-center justify-center bg-blue-950 text-white transition hover:bg-blue-900"
                            >
                                <Search size={18} />
                            </button>
                        </div>

                        {openSearch && (
                            <SearchSuggestionDropdown
                                suggestions={suggestions}
                                history={searchHistory}
                                keyword={keyword}
                                loading={searchLoading}
                                onSelect={goSearch}
                                onDeleteHistory={handleDeleteHistory}
                                onClearHistory={handleClearHistory}
                            />
                        )}
                    </form>

                    <div className="flex items-center gap-3 text-blue-950 dark:text-white md:gap-4">
                        <button
                            type="button"
                            onClick={() => setOpenMobileSearch(true)}
                            className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
                        >
                            <Search size={20} />
                        </button>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}

                            <span className="hidden lg:inline">{theme === 'dark' ? 'Sáng' : 'Tối'}</span>
                        </button>

                        <NotificationDropdown />

                        <Link
                            to="/cart"
                            className="relative hidden rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 md:block"
                        >
                            <ShoppingCart size={20} />

                            <Badge count={totalItems} />
                        </Link>
                    </div>
                </div>
            </div>

            {openMobileSearch && (
                <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 md:hidden">
                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                        <div ref={searchRef} className="relative">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenMobileSearch(false);

                                        setKeyword('');

                                        setOpenSearch(false);
                                    }}
                                    className="rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <X size={20} />
                                </button>

                                <form onSubmit={handleSearch} className="flex-1">
                                    <div className="flex h-12 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                        <input
                                            autoFocus
                                            value={keyword}
                                            onFocus={() => setOpenSearch(true)}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            placeholder="Tìm sản phẩm..."
                                            className="flex-1 bg-transparent px-4 outline-none dark:text-white"
                                        />

                                        <button className="flex w-12 items-center justify-center bg-blue-950 text-white">
                                            <Search size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {openSearch && (
                                <SearchSuggestionDropdown
                                    suggestions={suggestions}
                                    history={searchHistory}
                                    keyword={keyword}
                                    loading={searchLoading}
                                    onSelect={(value) => {
                                        goSearch(value);

                                        setOpenMobileSearch(false);
                                    }}
                                    onDeleteHistory={handleDeleteHistory}
                                    onClearHistory={handleClearHistory}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

function Badge({ count = 0 }) {
    if (!count || Number(count) <= 0) return null;

    return (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
        </span>
    );
}
