import React, { useState } from "react";

import { Search, ShoppingCart, User, X } from "lucide-react";
import { Link } from "react-router-dom";

function Header() {
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <>
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

            <header className="bg-white border-b sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 md:py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-8">
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
