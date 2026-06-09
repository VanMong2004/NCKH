import { useEffect, useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import MainLayout from '../layout/MainLayout';

import ProductGallery from '../components/productDetail/ProductGallery';
import ProductInfo from '../components/productDetail/ProductInfo';
import ProductBenefits from '../components/productDetail/ProductBenefits';
import ProductTabs from '../components/productDetail/ProductTabs';
import ProductReviews from '../components/productDetail/ProductReviews';
import RelatedProducts from '../components/productDetail/RelateProducts';

import productService from '../services/productService';

export default function ProductDetail() {
    const { slug } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!slug) {
            setError('Không tìm thấy đường dẫn sản phẩm.');
            setLoading(false);
            return;
        }

        loadProduct();
    }, [slug]);

    async function loadProduct() {
        try {
            setLoading(true);
            setError('');

            const result = await productService.getProductBySlug(slug);
            setProduct(result);
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Không thể tải chi tiết sản phẩm.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-5 sm:py-6">
                {loading && <ProductDetailSkeleton />}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30">
                        <p className="font-bold text-red-600 dark:text-red-400">{error}</p>

                        <button
                            type="button"
                            onClick={loadProduct}
                            className="mt-4 rounded-xl bg-blue-950 px-5 py-2.5 text-sm font-bold text-white dark:bg-blue-700"
                        >
                            Tải lại
                        </button>
                    </div>
                )}

                {!loading && !error && product && (
                    <>
                        <Breadcrumb product={product} />

                        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] items-start">
                            <div className="min-w-0">
                                <ProductGallery product={product} />
                            </div>

                            <div className="min-w-0">
                                <ProductInfo product={product} />
                            </div>
                        </section>

                        <div className="mt-6">
                            <ProductBenefits />
                        </div>

                        <section className="mt-6 space-y-6">
                            <ProductTabs product={product} />
                            <ProductReviews product={product} />
                        </section>

                        <section className="mt-6 min-w-0">
                            <RelatedProducts products={product.related_products || []} />
                        </section>
                    </>
                )}
            </main>
        </MainLayout>
    );
}

function Breadcrumb({ product }) {
    return (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <Link to="/shop" className="hover:text-blue-950 dark:hover:text-blue-300">
                Cửa hàng
            </Link>

            {product.categoryName && (
                <>
                    <ChevronRight size={14} />
                    <span>{product.categoryName}</span>
                </>
            )}

            <ChevronRight size={14} />

            <span className="line-clamp-1 text-blue-950 dark:text-blue-300">{product.name}</span>
        </div>
    );
}

function ProductDetailSkeleton() {
    return (
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="aspect-square animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="h-7 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-6 h-10 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-8 h-28 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
        </div>
    );
}
