import {
    Edit3,
    Image,
    Layers,
    Loader2,
    MonitorSmartphone,
    RefreshCcw,
    Smartphone,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import AdminSiteFormModal from '../components/site-content/AdminSiteFormModal';
import adminSiteContentService from '../services/adminSiteContentService';
import SiteQuickEditModal from '../components/site-content/SiteQuickEditModal';

const COMPONENT_ORDER = [
    'navbar',
    'hero_slider',
    'auth_banner',
    'mobile_menu',
    'bottom_navigation',
    'footer',
];

export default function AdminSiteContent() {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formState, setFormState] = useState({
        open: false,
        componentId: null,
    });

    const [quickEdit, setQuickEdit] = useState({
        open: false,
        type: '',
        component: null,
        item: null,
    });

    useEffect(() => {
        loadComponents();
    }, []);

    async function loadComponents() {
        try {
            setLoading(true);

            const result = await adminSiteContentService.getComponents({
                page_key: 'home',
            });

            setComponents(result.components || []);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải nội dung website');
        } finally {
            setLoading(false);
        }
    }

    function openEditor(component) {
        if (!component) return;

        setFormState({
            open: true,
            componentId: component.id,
        });
    }

    function closeEditor() {
        setFormState({
            open: false,
            componentId: null,
        });
    }

    async function handleSaved() {
        await loadComponents();
    }

    const sortedComponents = useMemo(() => {
        return [...components].sort((a, b) => {
            const ai = COMPONENT_ORDER.indexOf(a.componentKey);
            const bi = COMPONENT_ORDER.indexOf(b.componentKey);

            const av = ai === -1 ? 999 : ai;
            const bv = bi === -1 ? 999 : bi;

            return av - bv;
        });
    }, [components]);

    const componentMap = useMemo(() => {
        return Object.fromEntries(
            components.map((item) => [item.componentKey, item]),
        );
    }, [components]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Tùy biến giao diện website
                    </h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Xem mô phỏng Header, Slider, Footer rồi bấm vào từng khu vực để chỉnh sửa.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadComponents}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    Tải lại
                </button>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                        Đang tải giao diện...
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    <WebsitePreviewFrame>
                        <HeaderPreview
                            component={componentMap.navbar}
                            onEdit={() => openEditor(componentMap.navbar)}
                            onQuickEdit={openQuickEdit}
                        />

                        <HeroPreview
                            component={componentMap.hero_slider}
                            onEdit={() => openEditor(componentMap.hero_slider)}
                            onQuickEdit={openQuickEdit}
                        />                        

                        <FooterPreview
                            component={componentMap.footer}
                            onEdit={() => openEditor(componentMap.footer)}
                            onQuickEdit={openQuickEdit}
                        />                        
                    </WebsitePreviewFrame>

                    <AuthBannerPreview
                        component={componentMap.auth_banner}
                        onEdit={() => openEditor(componentMap.auth_banner)}
                        onQuickEdit={openQuickEdit}
                    />

                    <section className="grid gap-4 lg:grid-cols-2">
                        {sortedComponents.map((component) => (
                            <ComponentCard
                                key={component.id}
                                component={component}
                                onEdit={() => openEditor(component)}
                            />
                        ))}
                    </section>
                </div>
            )}

            <AdminSiteFormModal
                open={formState.open}
                componentId={formState.componentId}
                onClose={closeEditor}
                onSaved={handleSaved}
            />

            <SiteQuickEditModal
                open={quickEdit.open}
                type={quickEdit.type}
                component={quickEdit.component}
                item={quickEdit.item}
                onClose={closeQuickEdit}
                onSaved={handleSaved}
            />
        </div>
    );

    async function openQuickEdit(type, component, item = null) {
        if (!component) return;

        try {
            const fullComponent = await adminSiteContentService.getComponent(component.id);

            setQuickEdit({
                open: true,
                type,
                component: fullComponent,
                item,
            });
        } catch (error) {
            toast.error(error?.message || 'Không thể tải chi tiết nội dung');
        }
    }

    function closeQuickEdit() {
        setQuickEdit({
            open: false,
            type: '',
            component: null,
            item: null,
        });
    }
}

function WebsitePreviewFrame({ children }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>

                <div className="hidden rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 sm:block">
                    Preview trang chủ
                </div>

                <MonitorSmartphone size={18} className="text-slate-400" />
            </div>

            <div className="bg-white dark:bg-slate-900">
                {children}
            </div>
        </section>
    );
}

function HeaderPreview({ component, onEdit, onQuickEdit }) {
    const payload = component?.payload || {};
    const links = component?.items?.filter((item) => item.groupKey === 'desktop_links') || [];

    const title = component?.title || 'CTUT Shop';
    const subtitle = component?.subtitle || 'Cùng nhau phát triển';
    const logo = component?.image || '/images/logo.png';

    return (
        <PreviewBlock label="Header" onEdit={onEdit} disabled={!component}>
            <div className="border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={logo}
                            alt={title}
                            onClick={() => onQuickEdit('navbar-logo', component)}
                            className="h-11 w-11 cursor-pointer rounded-lg object-cover ring-2 ring-transparent hover:ring-blue-500"
                        />

                        <div
                            onClick={() => onQuickEdit('navbar-text', component)}
                            className="cursor-pointer rounded-lg p-1 hover:bg-blue-50"
                        >
                            <p className="font-black text-blue-950 dark:text-white">{title}</p>
                            <p className="text-xs text-slate-500">{subtitle}</p>
                        </div>
                    </div>

                    <div className="hidden flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400 md:block dark:border-slate-700">
                        {payload.search_placeholder || 'Tìm sản phẩm, khuyến mãi...'}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-950 dark:text-slate-100">
                    {links.length > 0 ? (
                        links.map((item) => (
                            <span key={item.id}>
                                {item.label || item.title}
                            </span>
                        ))
                    ) : (
                        <>
                            <span>Trang chủ</span>
                            <span>Sản phẩm</span>
                            <span>Khuyến mãi</span>
                            <span>Tin tức</span>
                        </>
                    )}
                </div>
            </div>
        </PreviewBlock>
    );
}

function HeroPreview({ component, onEdit, onQuickEdit }) {
    const slides = component?.items?.filter((item) => item.groupKey === 'hero_slides') || [];

    const firstSlide = slides[0];

    const image =
        firstSlide?.image ||
        component?.image ||
        '/images/system/Rectangle_3897.jpg';

    const title =
        firstSlide?.title ||
        component?.title ||
        'Kết nối sản phẩm, hoạt động và trải nghiệm sinh viên';

    const subtitle =
        firstSlide?.subtitle ||
        component?.subtitle ||
        'CTUT Shop';

    const content =
        firstSlide?.content ||
        component?.content ||
        'Khám phá sản phẩm nổi bật, cập nhật tin tức và theo dõi đơn hàng thuận tiện trên hệ thống.';

    return (
        <PreviewBlock label="Slider trang chủ" onEdit={onEdit} disabled={!component}>
            <div className="relative h-[320px] overflow-hidden bg-slate-900">
                <div
                    onClick={() => onQuickEdit('hero-slides-manager', component, firstSlide)}
                    className="absolute inset-0 z-10 cursor-pointer"
                />

                <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover opacity-80"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-950/60 to-transparent" />

                <div className="pointer-events-none absolute inset-0 z-20 flex items-center px-8">
                    <div className="max-w-2xl">
                        <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
                            {subtitle}
                        </span>

                        <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">
                            {title}
                        </h2>

                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/85">
                            {content}
                        </p>

                        <div className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950">
                            {firstSlide?.linkText || 'Xem cửa hàng'}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white">
                    {slides.length || 1} slide
                </div>
            </div>
        </PreviewBlock>
    );
}

function AuthBannerPreview({ component, onEdit, onQuickEdit }) {
    const title = component?.title || 'Đăng nhập CTUT Shop';
    const subtitle = component?.subtitle || 'Chào mừng bạn quay lại';
    const content = 
        component?.content ||
        'Đăng nhập để nhận thêm nhiều ưu đãi và theo dõi đơn hàng của bạn.';
    const image = component?.image || '/images/system/auth-banner.jpg';

    return (
        <PreviewBlock label="Auth Banner" onEdit={onEdit} disabled={!component}>
            <div
                onClick={() => onQuickEdit('auth-banner', component)}
                className="relative h-[600px] cursor-pointer overflow-hidden rounded-3xl"
            >
                {/* Background Image */}
                <img
                    src={image}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-white/15" />

                {/* Nội dung */}
                <div className="relative z-10 flex h-full flex-col justify-start px-10 pt-12">
                    <h2 className="mt-2 max-w-xl text-4xl font-extrabold leading-tight text-indigo-950">
                        {title}
                    </h2>

                    <p className="mt-4 max-w-md text-base leading-8 text-slate-700">
                        {content}
                    </p>
                </div>
            </div>
        </PreviewBlock>
    );
}

function FooterPreview({ component, onEdit, onQuickEdit }) {
    const columns = component?.items?.filter((item) => item.groupKey === 'footer_columns') || [];
    const contacts = component?.items?.filter((item) => item.groupKey === 'footer_contacts') || [];

    const title = component?.title || 'CTUT Shop';
    const subtitle = component?.subtitle || 'Cùng nhau phát triển';
    const content = component?.content || 'Cửa hàng trực tuyến phục vụ sinh viên, giảng viên và các hoạt động của nhà trường.';
    const logo = component?.image || '/images/logo.png';

    return (
        <PreviewBlock label="Footer" onEdit={onEdit} disabled={!component}>
            <div className="border-t border-slate-200 bg-white px-5 py-8 dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-6 md:grid-cols-4">
                    <div
                        onClick={() => onQuickEdit('footer-brand', component)}
                        className="cursor-pointer rounded-xl p-2 hover:bg-blue-50 dark:hover:bg-slate-800"
                    >
                        <div className="flex items-center gap-3">
                            <img
                                src={logo}
                                alt={title}
                                className="h-11 w-11 rounded-lg object-cover"
                            />

                            <div>
                                <p className="font-black text-blue-950 dark:text-white">
                                    {title}
                                </p>
                                <p className="text-xs text-slate-500">{subtitle}</p>
                            </div>
                        </div>

                        <p className="mt-4 line-clamp-3 text-sm text-slate-500">
                            {content}
                        </p>
                    </div>

                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">Liên kết</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-500">
                            {columns.length > 0 ? (
                                columns.slice(0, 4).map((item) => (
                                    <p key={item.id}>{item.title || item.label}</p>
                                ))
                            ) : (
                                <>
                                    <p>Trang chủ</p>
                                    <p>Sản phẩm</p>
                                    <p>Tin tức</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">Liên hệ</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-500">
                            {contacts.length > 0 ? (
                                contacts.slice(0, 4).map((item) => (
                                    <p key={item.id}>{item.label}</p>
                                ))
                            ) : (
                                <>
                                    <p>Cần Thơ, Việt Nam</p>
                                    <p>contact@ctut.edu.vn</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">Trạng thái</p>
                        <p className="mt-3 text-sm text-slate-500">
                            {component?.isActive ? 'Đang hiển thị' : 'Đã tắt'}
                        </p>
                    </div>
                </div>
            </div>
        </PreviewBlock>
    );
}

function PreviewBlock({ label, onEdit, disabled, children }) {
    return (
        <div className="group relative">
            {children}

            <div className="pointer-events-none absolute inset-0 border-2 border-transparent transition group-hover:border-blue-500/70" />

            <div className="absolute left-4 top-4 z-20 rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white shadow">
                {label}
            </div>

            <button
                type="button"
                disabled={disabled}
                onClick={onEdit}
                className="absolute right-4 top-4 z-20 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-black text-blue-950 shadow transition hover:bg-blue-50 disabled:opacity-60 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
                <Edit3 size={15} />
                Chỉnh sửa
            </button>
        </div>
    );
}

function ComponentCard({ component, onEdit }) {
    const config = getComponentConfig(component.componentKey);

    const Icon = config.icon;

    return (
        <button
            type="button"
            onClick={onEdit}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
        >
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <Icon size={22} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="font-black text-slate-900 dark:text-white">
                                {config.title}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {config.description}
                            </p>
                        </div>

                        <span
                            className={[
                                'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
                                component.isActive
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
                            ].join(' ')}
                        >
                            {component.isActive ? 'Đang bật' : 'Đã tắt'}
                        </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                            {component.itemsCount || 0} mục con
                        </span>

                        <span className="font-bold text-blue-700 dark:text-blue-300">
                            Chỉnh sửa →
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}

function getComponentConfig(key) {
    const map = {
        navbar: {
            title: 'Logo & Header',
            description: 'Đổi logo, tên website, slogan và menu đầu trang.',
            icon: MonitorSmartphone,
        },
        hero_slider: {
            title: 'Slider trang chủ',
            description: 'Quản lý banner lớn, ảnh nền, tiêu đề và nút bấm.',
            icon: Image,
        },
        auth_banner: {
            title: 'Banner đăng nhập / đăng ký',
            description: 'Đổi ảnh, tiêu đề và mô tả ở trang đăng nhập, đăng ký.',
            icon: Image,
        },
        mobile_menu: {
            title: 'Menu mobile',
            description: 'Quản lý menu mở rộng trên điện thoại.',
            icon: Smartphone,
        },
        bottom_navigation: {
            title: 'Menu dưới mobile',
            description: 'Quản lý thanh điều hướng cố định dưới màn hình điện thoại.',
            icon: Smartphone,
        },
        footer: {
            title: 'Footer',
            description: 'Thông tin cuối trang, liên hệ, mạng xã hội và liên kết.',
            icon: Layers,
        },
    };

    return map[key] || {
        title: 'Khu vực nội dung',
        description: 'Quản lý nội dung hiển thị ngoài website.',
        icon: Layers,
    };
}
