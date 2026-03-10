import { ChevronDown, LogOut, Menu, Search, ShoppingCart, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Tippy from '@tippyjs/react/headless'; // Dùng headless để dễ custom
import 'tippy.js/dist/tippy.css';
import logoImg from '../../../images/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { mockProducts } from '../../data/mockProducts';
import SearchResultItem from './SearchResultItem';
import ThemeToggle from './ThemeToggle';
import useDebounce from '../../hooks/useDebounce';

function Header() {
    const { totalItems } = useCart();
    const { user, logout } = useAuth();

    // --- State ---
    const [showMobileMenu, setShowMobileMenu] = useState(false); // Mobile
    const [showSearch, setShowSearch] = useState(false); // Mobile
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 500);
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const navigate = useNavigate();
    const inputRef = useRef(null); // Ref để focus input khi mở search mobile

    const handleSubmitSearch = (e) => {
        if ((e.key === 'Enter' || e.type === 'click') && searchQuery.trim()) {
            navigate(`/sanpham?keyword=${searchQuery}`);
            closeSearch();
        }
    };

    const closeSearch = () => {
        setShowDropdown(false); // Cái này là của chung mobile + desktop
        setShowSearch(false); // Cái này là của mobile
    };

    useEffect(() => {
        const keyword = debouncedQuery.trim();

        if (!keyword) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        // Mock filter logic (sau này thay bằng API call)
        const filtered = mockProducts.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()));

        setSearchResults(filtered.slice(0, 10));
        setShowDropdown(true);
    }, [debouncedQuery]);

    // Auto focus input khi mở mobile search
    useEffect(() => {
        if (showSearch && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showSearch]);

    return (
        <>
            {/* ========================== MOBILE SEARCH OVERLAY ========================= */}
            {showSearch && (
                <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col lg:hidden transition-colors duration-300">
                    {/* Header Mobile Search */}
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4 gap-3">
                        <div className="flex-1 relative flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                            <button>
                                <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSubmitSearch}
                                className="bg-transparent border-none outline-none text-base w-full ml-2 text-gray-900 dark:text-white placeholder-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setShowDropdown(false);
                                    }}
                                    className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowSearch(false)}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400"
                        >
                            Hủy
                        </button>
                    </div>

                    {/* Kết quả tìm kiếm Mobile (Hiển thị trực tiếp) */}
                    <div className="flex-1 overflow-y-auto p-0">
                        {searchResults.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {searchResults.map((item) => (
                                    <SearchResultItem key={item.id} item={item} closeSearch={closeSearch} />
                                ))}
                            </div>
                        ) : searchQuery ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                Không tìm thấy sản phẩm nào
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* ========================== MOBILE SIDEBAR MENU ========================= */}
            {showMobileMenu && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowMobileMenu(false)}
                    />
                    <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto transition-colors duration-300">
                        {/* Header Menu */}
                        <div className="p-6 flex items-center justify-between bg-blue-600 text-white">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.avatar}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full border-2 border-white object-cover"
                                    />
                                    <div>
                                        <p className="text-sm text-blue-100">Xin chào,</p>
                                        <p className="font-bold truncate max-w-[150px]">{user.name}</p>
                                    </div>
                                </div>
                            ) : (
                                <h2 className="text-xl font-bold">Menu</h2>
                            )}
                            <button
                                onClick={() => setShowMobileMenu(false)}
                                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav Items */}
                        <nav className="p-4 flex flex-col gap-2">
                            {['/', '/sanpham', '/phukien'].map((path, index) => (
                                <Link
                                    key={index}
                                    to={path}
                                    className="px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-700 dark:text-gray-200 transition-colors"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    {path === '/' ? 'Trang chủ' : path === '/sanpham' ? 'Sản phẩm' : 'Phụ kiện'}
                                </Link>
                            ))}

                            <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

                            {user ? (
                                <>
                                    <Link
                                        to="/taikhoan"
                                        className="px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-medium flex items-center gap-3 text-gray-700 dark:text-gray-200 transition-colors"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <User className="w-5 h-5" /> Thông tin tài khoản
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setShowMobileMenu(false);
                                        }}
                                        className="px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium flex items-center gap-3 w-full text-left transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" /> Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3 mt-2">
                                    <Link
                                        to="/auth/dangnhap"
                                        className="px-4 py-3 rounded-lg bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-bold text-center transition-colors"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        to="/auth/dangky"
                                        className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-center transition-colors"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        Đăng ký ngay
                                    </Link>
                                </div>
                            )}
                            <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between mt-2">
                                <span className="text-md font-medium text-gray-700 dark:text-gray-200">
                                    Chế độ giao diện
                                </span>
                                <ThemeToggle />
                            </div>
                        </nav>
                    </div>
                </div>
            )}

            {/* ========================== DESKTOP HEADER ========================= */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 h-[72px] flex items-center transition-colors duration-300">
                <div className="w-full md:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {/* Nút Menu Mobile */}
                            <button
                                onClick={() => setShowMobileMenu(true)}
                                className="p-2 rounded-lg lg:hidden text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            {/* Logo */}
                            <Link to="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                                    <img src={logoImg} alt="logo" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-bold text-lg md:text-xl text-gray-900 dark:text-white">
                                    CTUT Store
                                </span>
                            </Link>

                            {/* Nav Desktop */}
                            <nav className="hidden lg:flex items-center gap-8 ml-8">
                                {['/', '/sanpham', '/phukien', '/lienhe'].map((path, i) => (
                                    <Link
                                        key={i}
                                        to={path}
                                        className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {path === '/'
                                            ? 'Trang chủ'
                                            : path === '/sanpham'
                                              ? 'Sản phẩm'
                                              : path === '/phukien'
                                                ? 'Phụ kiện'
                                                : 'Liên hệ'}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Actions Right */}
                        <div className="flex items-center gap-2">
                            {/* --- DESKTOP SEARCH (Dùng Tippy) --- */}
                            <div className="hidden lg:block relative">
                                <Tippy
                                    visible={showDropdown && searchResults.length > 0}
                                    interactive={true}
                                    onClickOutside={() => setShowDropdown(false)}
                                    placement="bottom-start"
                                    offset={[0, 8]}
                                    render={(attrs) => (
                                        <div
                                            {...attrs}
                                            className="w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-auto max-h-[500px]"
                                        >
                                            {searchResults.map((item) => (
                                                <SearchResultItem key={item.id} item={item} closeSearch={closeSearch} />
                                            ))}
                                        </div>
                                    )}
                                >
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 w-64 focus-within:w-80 transition-all border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-gray-900">
                                        <button onClick={handleSubmitSearch}>
                                            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-600" />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => {
                                                if (searchResults.length > 0) setShowDropdown(true);
                                            }} // Focus lại thì hiện dropdown nếu có kq
                                            onKeyDown={handleSubmitSearch}
                                            className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                        />
                                    </div>
                                </Tippy>
                            </div>

                            {/* Nút Search Mobile */}
                            <button
                                onClick={() => setShowSearch(true)}
                                className="p-2 rounded-full lg:hidden text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            <div className="hidden lg:block">
                                <ThemeToggle />
                            </div>

                            <Link
                                to="/giohang"
                                className="p-2 rounded-full relative group text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ShoppingCart className="w-5 h-5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-gray-900">
                                    {totalItems}
                                </span>
                            </Link>

                            {/* User Actions */}
                            {user ? (
                                <div className="relative group ml-2 hidden sm:block">
                                    <button className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-1 pr-3 rounded-full border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                                        <img
                                            src={user.avatar}
                                            alt="User"
                                            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                        />
                                        <span className="text-sm font-medium hidden xl:block text-gray-700 dark:text-gray-200">
                                            {user.name}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <div className="absolute right-0 top-full w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                        <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 mb-1 font-bold truncate text-gray-900 dark:text-white">
                                            {user.name}
                                        </div>
                                        <Link
                                            to="/taikhoan"
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Thông tin tài khoản
                                        </Link>
                                        <Link
                                            to="/taikhoan?tab=donhang"
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Đơn mua
                                        </Link>
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" /> Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="hidden lg:flex items-center gap-2 ml-2">
                                    <Link
                                        to="/auth/dangnhap"
                                        className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 transition-colors"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        to="/auth/dangky"
                                        className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                            )}

                            {!user && (
                                <Link
                                    to="/auth/dangnhap"
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full lg:hidden text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                    <User className="w-5 h-5" />
                                </Link>
                            )}
                            {user && (
                                <Link
                                    to="/taikhoan"
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full sm:hidden transition-colors"
                                >
                                    <img
                                        src={user.avatar}
                                        alt="User"
                                        className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                                    />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}

export default Header;
