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

    const desktopSearchRef = useRef(null);
    const mobileSearchRef = useRef(null);

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
        if (user) {
            loadSearchHistory();
        } else {
            setSearchHistory([]);
        }
    }, [user]);
    useEffect(() => {
        if (user) {
            loadUnread();
        } else {
            setUnreadCount(0);
        }
    }, [user]);

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

    async function loadUnread() {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch {}
    }

    async function loadSuggestions(value) {
        const text = String(value || '').trim();

        if (text.length < 2) {
            setSuggestions([]);
            setSearchLoading(false);
            return;
        }

        try {
            setSearchLoading(true);

            const data = await searchService.suggestions(text);

            setSuggestions(data);
        } catch {
            setSuggestions([]);
        } finally {
            setSearchLoading(false);
        }
    }

    async function loadSearchHistory() {
        if (!user) {
            setSearchHistory([]);
            return;
        }

        try {
            const data = await searchService.history();

            setSearchHistory(data);
        } catch {
            setSearchHistory([]);
        }
    }

    function handleInputFocus() {
        if (user) {
            loadSearchHistory();
        } else {
            setSearchHistory([]);
        }

        setOpenSearch(true);
    }

    function handleInputChange(e) {
        setKeyword(e.target.value);
        setOpenSearch(true);
    }

    function goSearch(value) {
        const text = String(value || '').trim();

        if (!text) return;

        setKeyword(text);
        setOpenSearch(false);
        setOpenMobileMenu(false);
        setOpenMobileSearch(false);
        setSuggestions([]);

        navigate(`/shop?keyword=${encodeURIComponent(text)}`);
    }

    async function handleDeleteHistory(id) {
        if (!user) {
            setSearchHistory([]);
            return;
        }

        await searchService.deleteHistory(id);
        await loadSearchHistory();
    }

    async function handleClearHistory() {
        if (!user) {
            setSearchHistory([]);
            return;
        }

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

                    <form
                        ref={desktopSearchRef}
                        onSubmit={handleSearch}
                        className="relative hidden max-w-xl flex-1 md:block"
                    >
                        <div className="flex h-10 overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                            <input
                                value={keyword}
                                onFocus={handleInputFocus}
                                onChange={handleInputChange}
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
                            onClick={() => {
                                setOpenMobileSearch(true);
                                setOpenSearch(true);

                                if (user) {
                                    loadSearchHistory();
                                } else {
                                    setSearchHistory([]);
                                }
                            }}
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
                            aria-label="Giỏ hàng"
                        >
                            <ShoppingCart size={20} />
                            <Badge count={totalItems} />
                        </Link>

                        <div className="relative hidden md:block">
                            {user ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setOpenUserMenu((prev) => !prev)}
                                        className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                            <User size={18} />
                                        </div>

                                        <span className="max-w-[120px] truncate text-sm font-semibold">
                                            Xin chào, {user.name || 'Bạn'}
                                        </span>

                                        <ChevronDown size={16} />
                                    </button>

                                    {openUserMenu && (
                                        <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                                            <Link
                                                to="/account/profile"
                                                onClick={() => setOpenUserMenu(false)}
                                                className="block px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                Tài khoản của tôi
                                            </Link>

                                            <Link
                                                to="/account/orders"
                                                onClick={() => setOpenUserMenu(false)}
                                                className="block px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                Đơn hàng của tôi
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-slate-800"
                                            >
                                                <LogOut size={16} />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-900"
                                >
                                    Đăng nhập
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <nav className="hidden items-center gap-8 border-t border-slate-100 py-3 text-sm font-semibold text-blue-950 dark:border-slate-800 dark:text-slate-100 md:flex">
                    <button className="rounded-lg bg-blue-950 px-6 py-3 text-white transition hover:bg-blue-900">
                        ☰ Tất cả danh mục
                    </button>

                    <DesktopNavLink to="/">Trang chủ</DesktopNavLink>
                    <DesktopNavLink to="/shop">Cửa hàng</DesktopNavLink>
                    <DesktopNavLink to="/campaigns">Chiến dịch</DesktopNavLink>
                    <DesktopNavLink to="/account/orders">Đơn hàng</DesktopNavLink>
                    <DesktopNavLink to="/account/transactions">Giao dịch</DesktopNavLink>
                    <DesktopNavLink to="/about">Giới thiệu</DesktopNavLink>
                    <DesktopNavLink to="/blog">Blog</DesktopNavLink>
                    <DesktopNavLink to="/faq">FAQ</DesktopNavLink>
                    <DesktopNavLink to="/contact">Liên hệ</DesktopNavLink>
                    <DesktopNavLink to="/policy">Chính sách</DesktopNavLink>
                </nav>
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
                                    className="rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <X size={20} />
                                </button>

                                <form onSubmit={handleSearch} className="min-w-0 flex-1">
                                    <div className="flex h-12 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                                        <input
                                            autoFocus
                                            value={keyword}
                                            onFocus={handleInputFocus}
                                            onChange={handleInputChange}
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
                <MobileMenu
                    user={user}
                    totalItems={totalItems}
                    onClose={() => setOpenMobileMenu(false)}
                    onLogout={handleLogout}
                />
            )}
        </header>
    );
}

function DesktopNavLink({ to, children }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `transition hover:text-blue-700 dark:hover:text-blue-300 ${
                    isActive ? 'text-blue-700 dark:text-blue-300' : ''
                }`
            }
        >
            {children}
        </NavLink>
    );
}

function MobileMenu({ user, totalItems, onClose, onLogout }) {
    return (
        <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" onClick={onClose} className="absolute inset-0 bg-black/40" aria-label="Đóng menu" />

            <div className="relative h-full w-[82%] max-w-sm overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-950">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-blue-950 dark:text-white">ABC UNIVERSITY</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Together We Grow</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="space-y-2">
                    <MobileNavLink to="/" onClose={onClose}>
                        Trang chủ
                    </MobileNavLink>
                    <MobileNavLink to="/campaigns" onClose={onClose}>
                        Chiến dịch
                    </MobileNavLink>
                    <MobileNavLink to="/shop" onClose={onClose}>
                        Cửa hàng
                    </MobileNavLink>
                    <MobileNavLink to="/blog" onClose={onClose}>
                        Blog
                    </MobileNavLink>
                    <MobileNavLink to="/faq" onClose={onClose}>
                        FAQ
                    </MobileNavLink>
                    <MobileNavLink to="/policy" onClose={onClose}>
                        Chính sách
                    </MobileNavLink>
                    <MobileNavLink to="/about" onClose={onClose}>
                        Giới thiệu
                    </MobileNavLink>
                    <MobileNavLink to="/contact" onClose={onClose}>
                        Liên hệ
                    </MobileNavLink>
                    <MobileNavLink to="/cart" onClose={onClose}>
                        Giỏ hàng {totalItems > 0 ? `(${totalItems})` : ''}
                    </MobileNavLink>
                    <MobileNavLink to="/account/orders" onClose={onClose}>
                        Đơn hàng
                    </MobileNavLink>
                    <MobileNavLink to="/account/profile" onClose={onClose}>
                        Tài khoản
                    </MobileNavLink>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                    {user ? (
                        <button
                            type="button"
                            onClick={onLogout}
                            className="w-full rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500 dark:bg-red-950/30"
                        >
                            Đăng xuất
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            onClick={onClose}
                            className="block rounded-xl bg-blue-950 px-4 py-3 text-center text-sm font-bold text-white"
                        >
                            Đăng nhập
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

function MobileNavLink({ to, children, onClose }) {
    return (
        <NavLink
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-bold ${
                    isActive
                        ? 'bg-blue-950 text-white'
                        : 'text-blue-950 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800'
                }`
            }
        >
            {children}
        </NavLink>
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
