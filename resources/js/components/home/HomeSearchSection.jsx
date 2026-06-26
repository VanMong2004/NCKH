import { ArrowRight, Loader2, Search, Sparkles, TrendingUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import searchService from '../../services/searchService';

export default function HomeSearchSection({ trendingKeywords = [] }) {
    const navigate = useNavigate();

    const [keyword, setKeyword] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        const value = keyword.trim();

        if (value.length < 2) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(() => {
            loadSuggestions(value);
        }, 350);

        return () => clearTimeout(timer);
    }, [keyword]);

    async function loadSuggestions(value) {
        try {
            setLoadingSuggestions(true);

            const result = await searchService.suggestions(value);
            setSuggestions(Array.isArray(result) ? result.slice(0, 5) : []);
        } catch {
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();

        const value = keyword.trim();

        if (!value) return;

        navigate(`/shop?keyword=${encodeURIComponent(value)}`);
    }

    function goSearch(value) {
        const text = String(value || '')
            .replace(/^#/, '')
            .trim();

        if (!text) return;

        setKeyword(text);
        navigate(`/shop?keyword=${encodeURIComponent(text)}`);
    }

    const displayKeywords =
        trendingKeywords.length > 0 ? trendingKeywords : ['đồng phục', 'phụ kiện', 'bảng tên', 'sản phẩm mới'];

    return (
        <section className="mt-2 grid gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[minmax(0,1fr)_360px]">
            <div>
                <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        <Search size={19} />
                    </div>

                    <div>
                        <h2 className="text-lg font-black text-blue-950 dark:text-white">Tìm kiếm nhanh</h2>

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Tìm sản phẩm, danh mục, bài viết hoặc thông tin hỗ trợ.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm sản phẩm, danh mục, bài viết..."
                        className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-24 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/10"
                    />

                    {keyword ? (
                        <button
                            type="button"
                            onClick={() => {
                                setKeyword('');
                                setSuggestions([]);
                            }}
                            className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            <X size={15} />
                        </button>
                    ) : null}

                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-blue-950 text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        <ArrowRight size={17} />
                    </button>
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                    {loadingSuggestions ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            <Loader2 size={13} className="animate-spin" />
                            Đang gợi ý
                        </span>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((item, index) => {
                            const text = typeof item === 'string' ? item : item.keyword || item.name || item.title;

                            return (
                                <button
                                    key={`${text}-${index}`}
                                    type="button"
                                    onClick={() => goSearch(text)}
                                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                                >
                                    {text}
                                </button>
                            );
                        })
                    ) : (
                        ['Áo đồng phục', 'Bảng tên sinh viên', 'Phụ kiện', 'Sản phẩm mới'].map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => goSearch(item)}
                                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                            >
                                {item}
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
                <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-700 dark:text-blue-300" />

                    <h2 className="font-black text-blue-950 dark:text-white">Từ khóa nổi bật</h2>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Các nội dung đang được quan tâm trên hệ thống.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                    {displayKeywords.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => goSearch(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-950 hover:text-white dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
                        >
                            <Sparkles size={12} />
                            {String(item).startsWith('#') ? item : `#${item}`}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
