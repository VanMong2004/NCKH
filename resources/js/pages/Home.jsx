import { Loader2, RefreshCcw, Sparkles, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import CategoryList from '../components/home/CategoryList';
import HeroSection from '../components/home/HeroSection';
import HomePromotionGrid from '../components/home/HomePromotionGrid';
// import HomeSearchSection from '../components/home/HomeSearchSection';
import NewsList from '../components/home/NewsList';
import ProductGrid from '../components/product/ProductGrid';
import SectionHeader from '../components/ui/SectionHeader';
import MainLayout from '../layout/MainLayout';
import blogService from '../services/blogService';
import homeService from '../services/homeService';
import promotionService from '../services/promotionService';
import { mapBlogToHomeNews } from '../services/mappers/homeMapper';

const PRODUCT_TABS = [
    {
        key: 'featuredProducts',
        label: 'Nổi bật',
    },
    {
        key: 'newProducts',
        label: 'Mới nhất',
    },
    {
        key: 'bestSellingProducts',
        label: 'Bán chạy',
    },
    {
        key: 'topRatedProducts',
        label: 'Đánh giá cao',
    },
];

export default function Home() {
    const [home, setHome] = useState(null);
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeProductTab, setActiveProductTab] = useState('featuredProducts');
    const navigate = useNavigate();

    useEffect(() => {
        loadHome();
    }, []);

    function goSearch(value) {
        const text = String(value || '')
            .replace(/^#/, '')
            .trim();

        if (!text) return;

        navigate(`/shop?keyword=${encodeURIComponent(text)}`);
    }

    async function loadHome() {
        try {
            setLoading(true);

            const [homeResult, blogResult, promotionResult] = await Promise.allSettled([
                homeService.getHomeData(),
                blogService.getBlogs({
                    page: 1,
                    per_page: 4,
                }),
                promotionService.getPromotions({
                    status: 'active',
                    sort: 'ending_soon',
                    per_page: 4,
                }),
            ]);

            if (homeResult.status !== 'fulfilled') {
                throw homeResult.reason;
            }

            const newsEvents = homeResult.value.newsEvents?.length
                ? homeResult.value.newsEvents
                : blogResult.status === 'fulfilled'
                  ? (blogResult.value.blogs || []).map(mapBlogToHomeNews)
                  : [];

            setPromotions(
                promotionResult.status === 'fulfilled'
                    ? promotionResult.value.promotions || []
                    : [],
            );

            setHome({
                ...homeResult.value,
                newsEvents,
            });
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Không thể tải dữ liệu trang chủ';

            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    const activeProducts = useMemo(() => {
        if (!home) return [];

        return home[activeProductTab] || [];
    }, [home, activeProductTab]);

    if (loading && !home) {
        return (
            // <MainLayout>
            <MainLayout
                siteContent={home?.siteContent}
            >
                <main className="bg-slate-50 px-4 py-10 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            <Loader2 size={26} className="animate-spin" />
                        </div>

                        <p className="mt-4 text-sm font-black text-blue-950 dark:text-white">Đang tải trang chủ...</p>
                    </div>
                </main>
            </MainLayout>
        );
    }

    if (!home) {
        return (
            // <MainLayout>
            <MainLayout
                siteContent={home?.siteContent}
            >
                <main className="bg-slate-50 px-4 py-10 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                            <RefreshCcw size={24} />
                        </div>

                        <h1 className="mt-5 text-xl font-black text-blue-950 dark:text-white">
                            Không thể tải trang chủ
                        </h1>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Vui lòng thử lại sau hoặc kiểm tra kết nối hệ thống.
                        </p>

                        <button
                            type="button"
                            onClick={loadHome}
                            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            <RefreshCcw size={16} />
                            Tải lại
                        </button>
                    </div>
                </main>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <HeroSection heroSlider={home.heroSlider} />

                    {/* <HomeSearchSection trendingKeywords={home.trendingKeywords} /> */}

                    <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
                        <HomePromotionGrid promotions={promotions} />

                        <TrendingKeywordsCard
                            keywords={home.trendingKeywords}
                            onSearch={goSearch}
                        />
                    </section>

                    

                    <section className="mt-4 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <CategoryList categories={home.categories} />

                        <section className="min-w-0">
                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <SectionHeader title="Sản phẩm nổi bật" to="/shop" actionText="Xem cửa hàng" />

                                <ProductTabs activeKey={activeProductTab} onChange={setActiveProductTab} />

                                <div className="mt-2">
                                    {activeProducts.length > 0 ? (
                                        <ProductGrid products={activeProducts} />
                                    ) : (
                                        <EmptyBlock message="Chưa có sản phẩm trong nhóm này." />
                                    )}
                                </div>
                            </div>
                        </section>
                    </section>

                    <NewsList news={home.newsEvents} />
                </div>
            </main>
        </MainLayout>
    );
}

function ProductTabs({ activeKey, onChange }) {
    return (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {PRODUCT_TABS.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChange(tab.key)}
                    className={[
                        'h-10 shrink-0 rounded-xl border px-4 text-sm font-black transition',
                        activeKey === tab.key
                            ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-500 dark:bg-blue-600'
                            : 'border-slate-200 bg-white text-blue-950 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-blue-500/40 dark:hover:bg-slate-800',
                    ].join(' ')}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

function EmptyBlock({ message }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{message}</p>
        </div>
    );
}

function TrendingKeywordsCard({ keywords = [], onSearch }) {
    const displayKeywords =
        keywords.length > 0
            ? keywords
            : ['đồng phục', 'áo thun', 'phụ kiện', 'bảng tên', 'móc khóa'];

    return (
        <aside className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300">
                    <TrendingUp size={18} />
                </div>

                <div>
                    <h2 className="font-black text-blue-950 dark:text-white">
                        Từ khóa nổi bật
                    </h2>

                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Nhấn để xem nhanh sản phẩm
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {displayKeywords.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onSearch(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-950 hover:text-white dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
                    >
                        <Sparkles size={12} />
                        {String(item).startsWith('#') ? item : `#${item}`}
                    </button>
                ))}
            </div>
        </aside>
    );
}
