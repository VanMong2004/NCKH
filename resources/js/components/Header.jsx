import React, { useState } from "react";

import { Search, ShoppingCart, User, X, Menu } from "lucide-react";
import { Link } from "react-router-dom";

function Header() {
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    return (
        <>
            {/* Hiển thị Search Mobile */}
            {showSearch && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden">
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="text-lg font-semibold">
                            Tìm kiếm sản phẩm
                        </h2>
                        <button
                            onClick={() => setShowSearch(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            aria-label="Close search"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col p-4">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-3 mb-4">
                            <Search className="w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-base w-full"
                                autoFocus
                            />
                        </div>
                        {searchQuery && (
                            <div className="text-sm text-gray-600">
                                Tìm kiếm: "<strong>{searchQuery}</strong>"
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hiển thị Menu Mobile */}
            {showMobileMenu && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* backdrop gradient + blur */}
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-md"
                        onClick={() => setShowMobileMenu(false)}
                    />

                    {/* sidebar */}
                    <div
                        className={`
                        fixed inset-y-0 left-0 w-80 bg-slate-50
                        shadow-2xl border-r border-blue-100/50
                        transform transition-all duration-500 ease-out
                        ${showMobileMenu ? "translate-x-0" : "-translate-x-full"}
                    `}
                    >
                        {/* header */}
                        <div className="p-6 border-b border-blue-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    L
                                </div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                                    Menu
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowMobileMenu(false)}
                                className="p-3 rounded-full bg-white/80 hover:bg-white shadow-md hover:scale-110 transition-all duration-300"
                            >
                                <X className="w-6 h-6 text-indigo-700" />
                            </button>
                        </div>

                        {/* nav items */}
                        <nav className="px-6 py-8 flex flex-col gap-3">
                            {[
                                { to: "/", label: "Trang chủ" },
                                { to: "/products", label: "Đồng phục" },
                                { to: "/phu-kien", label: "Phụ kiện" },
                                { to: "/sang-che", label: "Sáng chế" },
                            ].map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setShowMobileMenu(false)}
                                    className={`group flex items-center gap-4 px-6 py-4 rounded-2xl
                                            text-gray-800 font-semibold text-lg
                                            bg-white/60 backdrop-blur-sm border border-white/40
                                            hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600
                                            hover:text-white hover:shadow-xl hover:scale-[1.03]
                                            transition-all duration-400 ease-out`}
                                >
                                    <span className="group-hover:translate-x-1 transition-transform">
                                        {item.label}
                                    </span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            <header className="bg-white border-b sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 md:py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-8">
                            <button
                                onClick={() => setShowMobileMenu(true)}
                                className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            <Link
                                href="/"
                                className="flex items-center gap-2 flex-shrink-0"
                            >
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-white rounded-sm" />
                                </div>
                                <span className="font-bold text-lg md:text-xl">
                                    CTUT Store
                                </span>
                            </Link>
                            <nav className="hidden md:flex items-center gap-6">
                                <Link
                                    to="/"
                                    className="text-sm font-medium hover:text-blue-600"
                                >
                                    Trang chủ
                                </Link>
                                <Link
                                    to="/products"
                                    className="text-sm font-medium hover:text-blue-600"
                                >
                                    Đồng phục
                                </Link>
                                <Link
                                    to="/phu-kien"
                                    className="text-sm font-medium hover:text-blue-600"
                                >
                                    Phụ kiện
                                </Link>
                                <Link
                                    to="/sang-che"
                                    className="text-sm font-medium hover:text-blue-600"
                                >
                                    Sáng chế
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 w-64">
                                <Search className="w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    className="bg-transparent border-none outline-none text-sm w-full"
                                />
                            </div>
                            <button
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                onClick={() => setShowSearch(true)}
                            >
                                <Search className="w-5 h-5 md:hidden" />
                            </button>

                            <Link
                                to="/cart"
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ShoppingCart className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/user"
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <User className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}

export default Header;
