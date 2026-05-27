import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, Moon, Search, ShoppingCart, Sun, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';

import NotificationDropdown from '../notifications/NotificationDropdown';
import SearchSuggestionDropdown from '../search/SearchSuggestionDropdown';

import searchService from '../../services/searchService';

export default function Navbar() {
    const navigate = useNavigate();

    const { user, logout } = useAuth();
    const { totalItems } = useCart();
    const { isDark, toggleTheme } = useTheme();

    const [keyword, setKeyword] = useState('');
    const [openSearch, setOpenSearch] = useState(false);
    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const [openMobileSearch, setOpenMobileSearch] = useState(false);

    const [suggestions, setSuggestions] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const desktopSearchRef = useRef(null);
    const mobileSearchRef = useRef(null);

    useEffect(() => {
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
            const clickedDesktop = desktopSearchRef.current && desktopSearchRef.current.contains(e.target);

            const clickedMobile = mobileSearchRef.current && mobileSearchRef.current.contains(e.target);

            if (!clickedDesktop && !clickedMobile) {
                setOpenSearch(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
        setOpenMobileSearch(false);
        setOpenMobileMenu(false);

        navigate(`/shop?keyword=${encodeURIComponent(text)}`);
    }

    function handleSearch(e) {
        e.preventDefault();
        goSearch(keyword);
    }

    async function handleDeleteHistory(id) {
        await searchService.deleteHistory(id);
        await loadSearchHistory();
    }

    async function handleClearHistory() {
        await searchService.clearHistory();
        setSearchHistory([]);
    }

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    function handleInputChange(e) {
        setKeyword(e.target.value);
        setOpenSearch(true);
    }

    function handleInputFocus() {
        loadSearchHistory();
        setOpenSearch(true);
    }

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex h-16 items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setOpenMobileMenu(true)}
                        className="rounded-lg p-2 text-blue-950 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800 md:hidden"
                    >
                        <Menu size={22} />
                    </button>

                    <Link to="/" className="flex shrink-0 items-center gap-2 text-blue-950 dark:text-white">
                        <img
                            src="/images/logo.png"
                            alt="CTUT"
                            className="h-10 w-10 object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />

                        <div>
                            <p className="font-extrabold leading-5">CTUT Shop</p>
                            <p className="hidden text-xs text-slate-500 sm:block">Together We Grow</p>
                        </div>
                    </Link>

                    <form
                        ref={desktopSearchRef}
                        onSubmit={handleSearch}
                        className="relative hidden max-w-xl flex-1 md:block"
                    >
                        <div className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                            <input
                                value={keyword}
                                onChange={handleInputChange}
                                onFocus={handleInputFocus}
                                placeholder="Tìm sản phẩm, chiến dịch..."
                                className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white"
                            />

                            <button
                                type="submit"
                                className="flex w-12 items-center justify-center bg-blue-950 text-white"
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

                    <div className="ml-auto flex items-center gap-2 text-blue-950 dark:text-white">
                        <button
                            type="button"
                            onClick={() => {
                                setOpenMobileSearch(true);
                                setOpenSearch(true);
                                loadSearchHistory();
                            }}
                            className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
                        >
                            <Search size={20} />
                        </button>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <NotificationDropdown />

                        <Link
                            to="/cart"
                            className="relative rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ShoppingCart size={21} />

                            {totalItems > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                    {totalItems > 99 ? '99+' : totalItems}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="hidden items-center gap-2 md:flex">
                                <Link
                                    to="/account"
                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <User size={18} />
                                    <span className="max-w-[130px] truncate">Xin chào, {user.name || 'bạn'}</span>
                                    <ChevronDown size={15} />
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="hidden rounded-xl bg-blue-950 px-4 py-2 text-sm font-bold text-white md:inline-flex"
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {openMobileSearch && (
                <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 md:hidden">
                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                        <div ref={mobileSearchRef} className="relative">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenMobileSearch(false);
                                        setOpenSearch(false);
                                    }}
                                    className="rounded-xl p-3 text-blue-950 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                                >
                                    <X size={20} />
                                </button>

                                <form onSubmit={handleSearch} className="min-w-0 flex-1">
                                    <div className="flex h-12 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                                        <input
                                            autoFocus
                                            value={keyword}
                                            onChange={handleInputChange}
                                            onFocus={handleInputFocus}
                                            placeholder="Tìm sản phẩm..."
                                            className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white"
                                        />

                                        <button
                                            type="submit"
                                            className="flex w-12 items-center justify-center bg-blue-950 text-white"
                                        >
                                            <Search size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="mt-3">
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
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {openMobileMenu && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        onClick={() => setOpenMobileMenu(false)}
                        className="absolute inset-0 bg-black/40"
                    />

                    <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">Menu</h2>

                            <button
                                type="button"
                                onClick={() => setOpenMobileMenu(false)}
                                className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="grid gap-2">
                            <Link
                                to="/"
                                onClick={() => setOpenMobileMenu(false)}
                                className="rounded-xl bg-slate-50 px-4 py-3 font-bold text-blue-950 dark:bg-slate-800 dark:text-white"
                            >
                                Trang chủ
                            </Link>

                            <Link
                                to="/campaigns"
                                onClick={() => setOpenMobileMenu(false)}
                                className="rounded-xl bg-slate-50 px-4 py-3 font-bold text-blue-950 dark:bg-slate-800 dark:text-white"
                            >
                                Chiến dịch
                            </Link>

                            <Link
                                to="/shop"
                                onClick={() => setOpenMobileMenu(false)}
                                className="rounded-xl bg-slate-50 px-4 py-3 font-bold text-blue-950 dark:bg-slate-800 dark:text-white"
                            >
                                Cửa hàng
                            </Link>

                            <Link
                                to="/account"
                                onClick={() => setOpenMobileMenu(false)}
                                className="rounded-xl bg-slate-50 px-4 py-3 font-bold text-blue-950 dark:bg-slate-800 dark:text-white"
                            >
                                Tài khoản
                            </Link>

                            {user ? (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="rounded-xl bg-red-50 px-4 py-3 text-left font-bold text-red-600 dark:bg-red-950/30"
                                >
                                    Đăng xuất
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setOpenMobileMenu(false)}
                                    className="rounded-xl bg-blue-950 px-4 py-3 text-center font-bold text-white"
                                >
                                    Đăng nhập
                                </Link>
                            )}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
