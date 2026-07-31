import { ChevronRight, FileText, Home, Loader2, RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import PolicyContent from '../components/policy/PolicyContent';
import PolicyNavigation from '../components/policy/PolicyNavigation';
import MainLayout from '../layout/MainLayout';
import policyService from '../services/policyService';

export default function Policy() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [policies, setPolicies] = useState([]);
    const [activePolicy, setActivePolicy] = useState(null);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState('');

    const activeSlug = searchParams.get('slug') || '';

    useEffect(() => {
        loadPolicies();
    }, []);

    useEffect(() => {
        if (policies.length === 0) return;

        const selected = policies.find((item) => item.slug === activeSlug) || policies[0];

        if (selected?.slug) {
            loadPolicyDetail(selected.slug);
        }
    }, [activeSlug, policies]);

    async function loadPolicies() {
        try {
            setLoadingList(true);
            setError('');

            const result = await policyService.getPolicies();
            const list = result.policies || [];

            setPolicies(list);

            if (list.length > 0 && !activeSlug) {
                setSearchParams({
                    slug: list[0].slug,
                });
            }
        } catch (err) {
            const message = err?.response?.data?.message || err.message || 'Không thể tải danh sách chính sách';

            setError(message);
            toast.error(message);
        } finally {
            setLoadingList(false);
        }
    }

    async function loadPolicyDetail(slug) {
        try {
            setLoadingDetail(true);
            setError('');

            const result = await policyService.getPolicyDetail(slug);
            setActivePolicy(result);
        } catch (err) {
            const message = err?.response?.data?.message || err.message || 'Không thể tải nội dung chính sách';

            setError(message);
            toast.error(message);
        } finally {
            setLoadingDetail(false);
        }
    }

    function handlePolicyChange(policy) {
        if (!policy?.slug) return;

        setSearchParams({
            slug: policy.slug,
        });
    }

    const currentPolicy = useMemo(() => {
        if (activePolicy) return activePolicy;

        return policies.find((item) => item.slug === activeSlug) || policies[0] || null;
    }, [activePolicy, policies, activeSlug]);

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <Breadcrumb />

                    <PolicyHeader />

                    {loadingList ? (
                        <PolicyPageLoading />
                    ) : error && policies.length === 0 ? (
                        <PolicyError message={error} onRetry={loadPolicies} />
                    ) : policies.length === 0 ? (
                        <PolicyEmpty />
                    ) : (
                        <section className="mt-7 grid gap-7 lg:grid-cols-[310px_minmax(0,1fr)]">
                            <PolicyNavigation
                                policies={policies}
                                activeSlug={currentPolicy?.slug}
                                onChange={handlePolicyChange}
                            />

                            <PolicyContent
                                policy={currentPolicy}
                                loading={loadingDetail}
                                onRetry={() => currentPolicy?.slug && loadPolicyDetail(currentPolicy.slug)}
                            />
                        </section>
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

            <span className="text-blue-950 dark:text-blue-300">Chính sách</span>
        </div>
    );
}

function PolicyHeader() {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100 blur-3xl dark:bg-blue-500/10" />
            <div className="absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-sky-100 blur-3xl dark:bg-sky-500/10" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <FileText size={14} />
                        Trung tâm chính sách
                    </div>

                    <h1 className="mt-5 text-3xl font-black text-blue-950 dark:text-white md:text-4xl">
                        Chính sách hệ thống
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Theo dõi các quy định về nhận hàng, thanh toán, hoàn trả, bảo mật và điều khoản.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-sm font-black text-blue-950 dark:text-white">Cần hỗ trợ?</p>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Liên hệ bộ phận hỗ trợ nếu bạn có thắc mắc về chính sách.
                    </p>

                    <Link
                        to="/contact"
                        className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-sm font-black text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/20 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-blue-500/10"
                    >
                        Liên hệ hỗ trợ
                    </Link>
                </div>
            </div>
        </section>
    );
}

function PolicyPageLoading() {
    return (
        <section className="mt-7 rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Loader2 size={26} className="animate-spin" />
            </div>

            <p className="mt-4 text-sm font-black text-blue-950 dark:text-white">Đang tải danh sách chính sách...</p>
        </section>
    );
}

function PolicyError({ message, onRetry }) {
    return (
        <section className="mt-7 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <RefreshCcw size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-blue-950 dark:text-white">Không thể tải chính sách</h2>

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

function PolicyEmpty() {
    return (
        <section className="mt-7 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-black text-blue-950 dark:text-white">Chưa có chính sách</h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Hệ thống chưa có chính sách nào đang hoạt động.
            </p>
        </section>
    );
}
