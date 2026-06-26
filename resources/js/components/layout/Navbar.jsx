import { ChevronDown, LayoutDashboard, LogOut, Menu, Moon, Search, ShoppingCart, Sun, User, X } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';

import searchService from '../../services/searchService';

import NotificationDropdown from '../notifications/NotificationDropdown';
import SearchSuggestionDropdown from '../search/SearchSuggestionDropdown';

// export default function Navbar() {
export default function Navbar({ siteContent, unreadCount = 0, notificationRefreshKey = 0 }) {
    const navigate = useNavigate();

    const desktopSearchRef = useRef(null);
    const mobileSearchRef = useRef(null);

    const { user, logout } = useAuth();
    const { totalItems } = useCart();
    const { theme, toggleTheme } = useTheme();

    //thêm
    const isAdmin =
        user?.role === 'admin' ||
        user?.role?.name === 'admin' ||
        (Array.isArray(user?.roles) && user.roles.includes('admin'));

    const navbar = siteContent?.navbar || {};
    const mobileMenu = siteContent?.mobile_menu || {};
    const site = siteContent?.site || {};

    const logo = navbar.logo || site.logo || '/images/logo.png';
    const mobileLogo = navbar.mobile_logo || logo;

    const siteName = navbar.title || site.name || 'CTUT Shop';
    const tagline = navbar.subtitle || site.tagline || 'Cùng nhau phát triển';

    const payload = navbar.payload || {};
    const searchPlaceholder = payload.search_placeholder || 'Tìm sản phẩm, khuyến mãi...';
    const mobileSearchPlaceholder = payload.mobile_search_placeholder || 'Tìm sản phẩm...';

    const desktopLinks = Array.isArray(navbar.desktop_links) && navbar.desktop_links.length
        ? navbar.desktop_links
        : [
            { label: 'Trang chủ', link_url: '/' },
            { label: 'Sản phẩm', link_url: '/shop' },
            { label: 'Khuyến mãi', link_url: '/promotions' },
            { label: 'Blog', link_url: '/blog' },
            { label: 'FAQ', link_url: '/faq' },
            { label: 'Giới thiệu', link_url: '/about' },
            { label: 'Liên hệ', link_url: '/contact' },
            { label: 'Chính sách', link_url: '/policy' },
        ];
    //

    const mobileLinks = Array.isArray(mobileMenu.links) && mobileMenu.links.length
        ? mobileMenu.links
        : desktopLinks;

    const [keyword, setKeyword] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [openSearch, setOpenSearch] = useState(false);

    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const [openMobileSearch, setOpenMobileSearch] = useState(false);
    const [openUserMenu, setOpenUserMenu] = useState(false);

    useEffect(() => {
        if (user) {
            loadSearchHistory();
        } else {
            setSearchHistory([]);
        }
    }, [user]);

    useEffect(() => {
        const value = keyword.trim();

        if (value.length < 2) {
            setSuggestions([]);
            setSearchLoading(false);
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

    function closeSearch() {
        setOpenSearch(false);
        setOpenMobileSearch(false);
        setSuggestions([]);
    }

    function goSearch(value) {
        const selected = typeof value === 'object' && value !== null ? value : null;

        const text = String(
            selected?.keyword || selected?.label || selected?.name || selected?.title || value || '',
        ).trim();

        if (!text) return;

        setKeyword(text);
        setOpenSearch(false);
        setOpenMobileMenu(false);
        setOpenMobileSearch(false);
        setSuggestions([]);

        if (selected?.url) {
            navigate(selected.url);
            return;
        }

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
        setSearchHistory([]);
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
                        {/* <img src="/images/logo.png" alt="CTUT" className="h-9 w-9 rounded" /> */}
                        <img src={logo} alt={siteName} className="h-9 w-9 rounded object-cover" />

                        <div>
                            {/* <h1 className="text-sm font-bold text-blue-950 dark:text-white md:text-lg">CTUT Shop</h1> */}
                            <h1 className="text-sm font-bold text-blue-950 dark:text-white md:text-lg">{siteName}</h1>

                            <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">
                                {/* Cùng nhau phát triển */}
                                {tagline}
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
                                // placeholder="Tìm sản phẩm, khuyến mãi..."
                                placeholder={searchPlaceholder}
                                className="min-w-0 flex-1 px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:bg-slate-900 dark:text-white"
                            />

                            {keyword ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setKeyword('');
                                        setSuggestions([]);
                                    }}
                                    className="flex w-10 items-center justify-center text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            ) : null}

                            <button
                                type="submit"
                                className="flex w-12 items-center justify-center bg-blue-950 text-white transition hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
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
                                isAuthenticated={Boolean(user)}
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

                        {isAdmin && (
                            <Link
                                to="/admin/dashboard"
                                className="hidden h-10 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-700 hover:bg-blue-100 md:inline-flex dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                            >
                                <LayoutDashboard size={16} />
                                Quản trị
                            </Link>
                        )}

                        <NotificationDropdown
                            unreadCount={unreadCount}
                            refreshKey={notificationRefreshKey}
                        />

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

                <nav className="hidden items-center justify-start ps-2 gap-8 border-t border-slate-100 py-3 text-sm font-semibold text-blue-950 dark:border-slate-800 dark:text-slate-100 md:flex">
                    {/* <DesktopNavLink to="/">Trang chủ</DesktopNavLink>
                    <DesktopNavLink to="/shop">Sản phẩm</DesktopNavLink>
                    <DesktopNavLink to="/promotions">Khuyến mãi</DesktopNavLink>
                    <DesktopNavLink to="/blog">Blog</DesktopNavLink>
                    <DesktopNavLink to="/faq">FAQ</DesktopNavLink>
                    <DesktopNavLink to="/about">Giới thiệu</DesktopNavLink>
                    <DesktopNavLink to="/contact">Liên hệ</DesktopNavLink>
                    <DesktopNavLink to="/policy">Chính sách</DesktopNavLink> */}
                    {desktopLinks.map((item) => (
                        <DesktopNavLink key={item.id || item.item_key || item.link_url} to={item.link_url || '/'}>
                            {item.label || item.title}
                        </DesktopNavLink>
                    ))}
                </nav>
            </div>

            {openMobileSearch && (
                <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 md:hidden">
                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                        <div ref={mobileSearchRef} className="relative">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={closeSearch}
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
                                            // placeholder="Tìm sản phẩm..."
                                            placeholder={mobileSearchPlaceholder}
                                            className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white"
                                        />

                                        {keyword ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setKeyword('');
                                                    setSuggestions([]);
                                                }}
                                                className="flex w-10 items-center justify-center text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                                            >
                                                <X size={16} />
                                            </button>
                                        ) : null}

                                        <button
                                            type="submit"
                                            className="flex w-12 items-center justify-center bg-blue-950 text-white dark:bg-blue-600"
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
                                        isAuthenticated={Boolean(user)}
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
                // <MobileMenu
                //     user={user}
                //     totalItems={totalItems}
                //     onClose={() => setOpenMobileMenu(false)}
                //     onLogout={handleLogout}
                // />
                <MobileMenu
                    user={user}
                    isAdmin={isAdmin}
                    totalItems={totalItems}
                    siteName={siteName}
                    tagline={tagline}
                    logo={mobileLogo}
                    links={mobileLinks}
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

// function MobileMenu({ user, totalItems, onClose, onLogout }) {
function MobileMenu({ user, isAdmin, totalItems, siteName, tagline, logo, links = [], onClose, onLogout }) {
    return (
        <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" onClick={onClose} className="absolute inset-0 bg-black/40" aria-label="Đóng menu" />

            <div className="relative h-full w-[82%] max-w-sm overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-950">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        {/* <h2 className="font-bold text-blue-950 dark:text-white">CTUT Shop</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Cùng nhau phát triển</p> */}
                        <div className="flex items-center gap-3">
                            <img src={logo} alt={siteName} className="h-9 w-9 rounded object-cover" />
                            <div>
                                <h2 className="font-bold text-blue-950 dark:text-white">{siteName}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{tagline}</p>
                            </div>
                        </div>
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
                    {/* <MobileNavLink to="/" onClose={onClose}>
                        Trang chủ
                    </MobileNavLink>

                    <MobileNavLink to="/shop" onClose={onClose}>
                        Sản phẩm
                    </MobileNavLink>

                    <MobileNavLink to="/account/orders" onClose={onClose}>
                        Đơn hàng
                    </MobileNavLink>

                    <MobileNavLink to="/promotions" onClose={onClose}>
                        Khuyến mãi
                    </MobileNavLink>

                    <MobileNavLink to="/blog" onClose={onClose}>
                        Blog
                    </MobileNavLink>

                    <MobileNavLink to="/faq" onClose={onClose}>
                        FAQ
                    </MobileNavLink>

                    <MobileNavLink to="/about" onClose={onClose}>
                        Giới thiệu
                    </MobileNavLink>

                    <MobileNavLink to="/contact" onClose={onClose}>
                        Liên hệ
                    </MobileNavLink>

                    <MobileNavLink to="/policy" onClose={onClose}>
                        Chính sách
                    </MobileNavLink> */}
                    {links.map((item) => (
                        <MobileNavLink
                            key={item.id || item.item_key || item.link_url}
                            to={item.link_url || '/'}
                            onClose={onClose}
                        >
                            {item.label || item.title}
                        </MobileNavLink>
                    ))}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                    {isAdmin && (
                        <Link
                            to="/admin/dashboard"
                            onClick={onClose}
                            className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white"
                        >
                            <LayoutDashboard size={18} />
                            Vào trang quản trị
                        </Link>
                    )}
                    
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
