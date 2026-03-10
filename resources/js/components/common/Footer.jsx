import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTiktok, FaTwitter, FaYoutube } from 'react-icons/fa';

function Footer() {
    return (
        <footer className="bg-surface border-t border-default transition-colors">
            <div className="w-full md:max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
                    {/* Logo & description */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white rounded-sm" />
                            </div>
                            <span className="font-bold text-lg text-title">CTUT Store</span>
                        </div>
                        <p className="text-xs md:text-sm text-muted">
                            Cửa hàng chính thức cung cấp đồng phục và các sản phẩm sáng chế của Trường Đại học Kỹ thuật
                            - Công nghệ Cần Thơ
                        </p>
                    </div>

                    {/* Store links */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3 text-title">Cửa hàng</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/sanpham" className="text-xs md:text-sm text-body hover:text-blue-800">
                                    Sản phẩm
                                </Link>
                            </li>
                            <li>
                                <Link to="/phu-kien" className="text-xs md:text-sm text-body hover:text-blue-800">
                                    Phụ kiện
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3 text-title">Hỗ trợ</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/lienhe" className="text-xs md:text-sm text-body">
                                    Liên hệ chúng tôi
                                </Link>
                            </li>
                            <li>
                                <Link to="/size" className="text-xs md:text-sm text-body hover:text-blue-800">
                                    Hướng dẫn size
                                </Link>
                            </li>
                            <li>
                                <Link to="/chinhsachdoitra" className="text-xs md:text-sm text-body hover:text-blue-800">
                                    Chính sách đổi trả
                                </Link>
                            </li>
                            <li>
                                <Link to="/dieukhoan" className="text-xs md:text-sm text-body hover:text-blue-800">
                                    Chính sách và điều khoản
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3 text-title">Kết nối</h4>
                        <div className="flex">
                            <a href="https://www.facebook.com/CTUT.CT" target="_blank" className="px-3 py-2 rounded-lg">
                                <FaFacebookF className="hover:opacity-80" color="#1877F2" size={20} />
                            </a>
                            <a
                                href="https://www.tiktok.com/@tuyensinh.ctuet.edu.vn"
                                target="_blank"
                                className="px-3 py-2 rounded-lg"
                            >
                                <FaTiktok className="hover:opacity-80" color="#000000" size={20} />
                            </a>
                            <a
                                href="https://www.tiktok.com/@tuyensinh.ctuet.edu.vn"
                                target="_blank"
                                className="px-3 py-2 rounded-lg"
                            >
                                <FaYoutube className="hover:opacity-80" color="#FF0000" size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t pt-6 md:pt-8 flex items-center justify-center gap-4">
                    <p className="text-xs md:text-sm text-muted">© 2025 Trường Đại học Kỹ thuật - Công nghệ Cần Thơ.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
