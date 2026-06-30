import { ArrowRight, ChevronRight, Home, Loader2, RefreshCcw, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import AboutContent from '../components/about/AboutContent';
import AboutGallery from '../components/about/AboutGallery';
import AboutHero from '../components/about/AboutHero';
import AboutStats from '../components/about/AboutStats';
import MainLayout from '../layout/MainLayout';
import aboutService from '../services/aboutService';

export default function About() {
    const [about, setAbout] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAbout();
    }, []);

    async function loadAbout() {
        try {
            setLoading(true);
            setError('');

            const result = await aboutService.getAbout();
            setAbout(result);
        } catch (err) {
            const message = err?.response?.data?.message || err.message || 'Không thể tải thông tin giới thiệu';

            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                    <Breadcrumb />

                    {loading ? (
                        <AboutLoading />
                    ) : error && !about ? (
                        <AboutError message={error} onRetry={loadAbout} />
                    ) : (
                        <div className="space-y-8">
                            <AboutHero about={about} />

                            <AboutStats stats={about?.stats} />

                            <AboutContent about={about} />

                            <AboutGallery images={about?.gallery || []} />

                            <AboutCTA />
                        </div>
                    )}
                </div>
            </main>
        </MainLayout>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-2 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Giới thiệu</span>
        </div>
    );
}

function AboutLoading() {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Loader2 size={26} className="animate-spin" />
            </div>

            <p className="mt-4 text-sm font-black text-blue-950 dark:text-white">Đang tải thông tin giới thiệu...</p>
        </section>
    );
}

function AboutError({ message, onRetry }) {
    return (
        <section className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <RefreshCcw size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-blue-950 dark:text-white">Không thể tải trang giới thiệu</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
                <RefreshCcw size={16} />
                Thử lại
            </button>
        </section>
    );
}

function AboutCTA() {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-blue-950 p-6 text-white shadow-sm dark:border-blue-500/20 dark:bg-blue-600 sm:p-8 lg:p-10">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-12 left-10 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-100">
                        <Sparkles size={14} />
                        Bắt đầu trải nghiệm
                    </div>

                    <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight md:text-3xl">
                        Khám phá sản phẩm, khuyến mãi và hoạt động mới nhất
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                        Hệ thống giúp người dùng dễ dàng theo dõi thông tin, đặt hàng, chọn khuyến mãi và nhận hỗ trợ
                        khi cần.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                        to="/shop"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-blue-950 transition hover:bg-blue-50"
                    >
                        Xem cửa hàng
                        <ArrowRight size={16} />
                    </Link>

                    <Link
                        to="/promotions"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-5 text-sm font-black text-white transition hover:bg-white/10"
                    >
                        Xem khuyến mãi
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
