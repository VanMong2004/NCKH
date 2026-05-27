import { Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="mt-10 border-t border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <img src="/images/logo.png" alt="ABC University" className="h-11 w-11 rounded" />

                            <div>
                                <h3 className="font-bold text-blue-950 dark:text-white">CTUT </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Together We Grow</p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Cửa hàng trực tuyến phục vụ sinh viên, giảng viên và các chiến dịch của nhà trường.
                        </p>
                    </div>

                    <FooterColumn
                        title="Liên kết"
                        links={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Cửa hàng', to: '/shop' },
                            { label: 'Chiến dịch', to: '/campaigns' },
                            { label: 'Sự kiện', to: '/events' },
                        ]}
                    />

                    <FooterColumn
                        title="Hỗ trợ"
                        links={[
                            { label: 'Tài khoản', to: '/account/profile' },
                            { label: 'Đơn hàng', to: '/account/orders' },
                            { label: 'Giỏ hàng', to: '/cart' },
                            { label: 'Liên hệ', to: '/contact' },
                        ]}
                    />

                    <div>
                        <h4 className="font-bold text-blue-950 dark:text-white">Thông tin liên hệ</h4>

                        <div className="mt-4 space-y-3 text-sm">
                            <Info icon={MapPin}>Cần Thơ, Việt Nam</Info>

                            <Info icon={Phone}>02923 xxx xxx</Info>

                            <Info icon={Mail}>contact@abcuniversity.edu.vn</Info>

                            <div className="flex gap-3 pt-2">
                                <a
                                    href="#"
                                    className="rounded-full border border-slate-200 p-2 text-blue-950 transition hover:bg-blue-950 hover:text-white dark:border-slate-700 dark:text-white"
                                    aria-label="Facebook"
                                >
                                    <Facebook size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    © 2026 ABC University Shop. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({ title, links }) {
    return (
        <div>
            <h4 className="font-bold text-blue-950 dark:text-white">{title}</h4>

            <div className="mt-4 space-y-2 text-sm">
                {links.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="block transition hover:text-blue-700 dark:hover:text-blue-300"
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}

function Info({ icon: Icon, children }) {
    return (
        <div className="flex items-start gap-3">
            <Icon size={17} className="mt-0.5 shrink-0 text-blue-950 dark:text-blue-300" />
            <span>{children}</span>
        </div>
    );
}
