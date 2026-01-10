import React from "react";

import { ArrowRight, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="bg-white border-t">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white rounded-sm" />
                            </div>
                            <span className="font-bold text-lg">
                                CTUT Store
                            </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600">
                            Cửa hàng chính thức cung cấp đồng phục và các sản
                            phẩm sáng chế của Trường Đại học Kỹ thuật - Công
                            nghệ Cần Thơ
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Cửa hàng</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/dong-phuc-nam"
                                    className="text-xs md:text-sm text-gray-600 hover:text-blue-700"
                                >
                                    Đồng phục Nam
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dong-phuc-nu"
                                    className="text-xs md:text-sm text-gray-600 hover:text-blue-700"
                                >
                                    Đồng phục nữ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/phu-kien"
                                    className="text-xs md:text-sm text-gray-600 hover:text-blue-700"
                                >
                                    Phụ kiện
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/sang-che"
                                    className="text-xs md:text-sm text-gray-600 hover:text-blue-700"
                                >
                                    Sáng chế
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Hổ trợ</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/contact"
                                    className="text-xs md:text-sm text-gray-600 hover:text-blue-700"
                                >
                                    Liện hệ chúng tôi
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/size-guide"
                                    className="text-xs md:text-sm text-gray-600 hover:text-blue-700"
                                >
                                    Hướng dẫn size
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/returns"
                                    className="text-xs md:text-sm text-gray-600 hover:text-blue-700"
                                >
                                    Chính sách đổi trả
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-xs md:text-sm text-gray-600 hover:text-blue-700"
                                >
                                    Chính sách và điều khoản
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Kết nối</h4>

                        <div className="flex">
                            <button
                                className="px-3 py-2 rounded-lg "
                                aria-label="Subscribe"
                            >
                                <Facebook className="hover:text-blue-700"/>
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg "
                                aria-label="Subscribe"
                            >
                                <Instagram className="hover:text-blue-700"/>
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg "
                                aria-label="Subscribe"
                            >
                                <Twitter className="hover:text-blue-700"/>
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg "
                                aria-label="Subscribe"
                            >
                                <Youtube className="hover:text-blue-700"/>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="border-t pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs md:text-sm text-gray-600">
                        © 2026 CTUT Uniform Store. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <button
                            className="text-gray-600 hover:text-blue-700"
                            aria-label="Twitter"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                            </svg>
                        </button>
                        <button
                            className="text-gray-600 hover:text-blue-700"
                            aria-label="Instagram"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
