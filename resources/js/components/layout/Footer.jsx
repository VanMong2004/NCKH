import { Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

// export default function Footer() {
export default function Footer({ footer }) {
    //thêm
    const brand = footer?.brand || {};
    const columns = Array.isArray(footer?.columns) ? footer.columns : [];
    const contacts = Array.isArray(footer?.contacts) ? footer.contacts : [];
    const socials = Array.isArray(footer?.socials) ? footer.socials : [];
    const payload = footer?.payload || {};

    const title = brand.title || 'CTUT Shop';
    const subtitle = brand.subtitle || 'Cùng nhau phát triển';
    const content = brand.content || 'Cửa hàng trực tuyến phục vụ sinh viên, giảng viên và các hoạt động của Trường.';
    const logo = brand.logo || '/images/logo.png';
    const copyright = payload.copyright || '© 2026 CTUT Shop. All rights reserved.';
    //
    return (
        <footer className="border-t border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-3">
                            {/* <img src="/images/logo.png" alt="CTUT Shop" className="h-11 w-11 rounded" /> */}
                            <img src={logo} alt={title} className="h-11 w-11 rounded object-cover" />

                            <div>
                                {/* <h3 className="font-bold text-blue-950 dark:text-white">CTUT Shop</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Cùng nhau phát triển</p> */}
                                <h3 className="font-bold text-blue-950 dark:text-white">{title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                            </div>
                        </div>

                        {/* <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Cửa hàng trực tuyến phục vụ sinh viên, giảng viên và các hoạt động của Trường.
                        </p> */}
                        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {content}
                        </p>
                    </div>

                    {columns.length > 0 ? (
                        columns.map((column) => (
                            <FooterColumn
                                key={column.id || column.item_key}
                                title={column.title || column.label}
                                links={(column.links || []).map((item) => ({
                                    label: item.label || item.title,
                                    to: item.link_url || '/',
                                }))}
                            />
                        ))
                    ) : (
                        <>
                            <FooterColumn
                                title="Khám phá"
                                links={[
                                    { label: 'Trang chủ', to: '/' },
                                    { label: 'Sản phẩm', to: '/shop' },
                                    { label: 'Khuyến mãi', to: '/promotions' },
                                    { label: 'Blog', to: '/blog' },
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
                        </>
                    )}

                    {/* <div>
                        <h4 className="font-bold text-blue-950 dark:text-white">Thông tin liên hệ</h4>

                        <div className="mt-4 space-y-3 text-sm">
                            <Info icon={MapPin}>Cần Thơ, Việt Nam</Info>

                            <Info icon={Phone}>02923 xxx xxx</Info>

                            <Info icon={Mail}>contact@ctut.edu.vn</Info>

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
                    </div> */}
                    <div>
                        <h4 className="font-bold text-blue-950 dark:text-white">Thông tin liên hệ</h4>

                        <div className="mt-4 space-y-3 text-sm">
                            {contacts.length > 0 ? (
                                contacts.map((item) => (
                                    <Info key={item.id || item.item_key} icon={getContactIcon(item.icon_key)}>
                                        {item.label || item.content}
                                    </Info>
                                ))
                            ) : (
                                <>
                                    <Info icon={MapPin}>Cần Thơ, Việt Nam</Info>
                                    <Info icon={Phone}>02923 xxx xxx</Info>
                                    <Info icon={Mail}>contact@ctut.edu.vn</Info>
                                </>
                            )}

                            <div className="flex gap-3 pt-2">
                                {socials.length > 0 ? (
                                    socials.map((item) => (
                                        <a
                                            key={item.id || item.item_key}
                                            href={item.link_url || '#'}
                                            target={item.target || '_blank'}
                                            rel="noreferrer"
                                            className="rounded-full border border-slate-200 p-2 text-blue-950 transition hover:bg-blue-950 hover:text-white dark:border-slate-700 dark:text-white"
                                            aria-label={item.label || 'Social'}
                                        >
                                            <Facebook size={18} />
                                        </a>
                                    ))
                                ) : (
                                    <a href="https://www.facebook.com/CTUT.CT" className="rounded-full border border-slate-200 p-2 text-blue-950 transition hover:bg-blue-950 hover:text-white dark:border-slate-700 dark:text-white" aria-label="Facebook">
                                        <Facebook size={18} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    {/* © 2026 CTUT Shop. All rights reserved. */}
                    {copyright}
                </div>
            </div>
        </footer>
    );
}

//thêm
function getContactIcon(iconKey) {
    const key = String(iconKey || '').toLowerCase();

    if (key.includes('phone')) return Phone;
    if (key.includes('mail') || key.includes('email')) return Mail;

    return MapPin;
}
//

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
