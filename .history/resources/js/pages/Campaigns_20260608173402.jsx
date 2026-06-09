import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import MainLayout from '../layout/MainLayout';

import CampaignFilters from '../components/campaign/CampaignFilters';
import CampaignGrid from '../components/campaign/CampaignGrid';
import CampaignBenefits from '../components/campaign/CampaignBenefits';

import campaignService from '../services/campaignService';

export default function Campaigns() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
    });

    const filters = {
        status: searchParams.get('status') || '',
        sort: searchParams.get('sort') || '',
        keyword: searchParams.get('keyword') || '',
        page: Number(searchParams.get('page') || 1),
        per_page: Number(searchParams.get('per_page') || 8),
    };

    useEffect(() => {
        loadCampaigns();
    }, [searchParams]);

    async function loadCampaigns() {
        try {
            setLoading(true);

            const result = await campaignService.getCampaigns({
                status: filters.status || undefined,
                sort: filters.sort || undefined,
                keyword: filters.keyword || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setCampaigns(result.campaigns);
            setMeta(result.meta);
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách chiến dịch');
        } finally {
            setLoading(false);
        }
    }

    function updateFilter(next) {
        const params = new URLSearchParams(searchParams);

        Object.entries(next).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        if (!next.page) {
            params.set('page', '1');
        }

        setSearchParams(params);
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Breadcrumb />

                <section className="mb-6">
                    <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Chiến dịch</h1>

                    <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi và tham gia các chiến dịch đang mở của trường.
                    </p>
                </section>

                <CampaignFilters status={filters.status} sort={filters.sort} onChange={updateFilter} />

                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-blue-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                        Đang tải chiến dịch...
                    </div>
                ) : campaigns.length > 0 ? (
                    <CampaignGrid campaigns={campaigns} />
                ) : (
                    <EmptyCampaign />
                )}

                {!loading && campaigns.length > 0 && (
                    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm font-semibold text-blue-950 dark:text-white">
                            Hiển thị {campaigns.length} / {meta.total} chiến dịch
                        </p>

                        <Pagination meta={meta} onPageChange={(page) => updateFilter({ page })} />
                    </div>
                )}

                <CampaignBenefits />
            </main>
        </MainLayout>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <span className="text-blue-950 dark:text-blue-300">Chiến dịch</span>
        </div>
    );
}

function Pagination({ meta, onPageChange }) {
    if (meta.lastPage <= 1) return null;

    const pages = Array.from({ length: meta.lastPage }, (_, index) => index + 1).slice(0, 5);

    return (
        <div className="hidden items-center gap-2 md:flex">
            <PageButton disabled={meta.currentPage <= 1} onClick={() => onPageChange(meta.currentPage - 1)}>
                <ChevronLeft size={16} />
            </PageButton>

            {pages.map((page) => (
                <PageButton key={page} active={page === meta.currentPage} onClick={() => onPageChange(page)}>
                    {page}
                </PageButton>
            ))}

            <PageButton disabled={meta.currentPage >= meta.lastPage} onClick={() => onPageChange(meta.currentPage + 1)}>
                <ChevronRight size={16} />
            </PageButton>
        </div>
    );
}

function PageButton({ children, active = false, disabled = false, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-bold disabled:opacity-50 ${
                active
                    ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-700 dark:bg-blue-700'
                    : 'border-slate-200 bg-white text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
            }`}
        >
            {children}
        </button>
    );
}

function EmptyCampaign() {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-extrabold text-blue-950 dark:text-white">Chưa có chiến dịch phù hợp</h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Hãy thử đổi bộ lọc hoặc quay lại sau.</p>
        </div>
    );
}
