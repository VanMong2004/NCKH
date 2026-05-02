import { Grid3x3, List, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Breadcrumb from '../components/common/Breadcrumb';
import ProductCard from '../components/common/ProductCard';
import productService from '../services/productService';
import categoryService from '../services/categoryService';

function Products() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [categoriesFromApi, setCategoriesFromApi] = useState([]);
    const [loading, setLoading] = useState(true);

    const keyword = searchParams.get('keyword') || '';
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'popular';
    const viewMode = searchParams.get('viewmode') || 'grid';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [productData, categoryData] = await Promise.all([
                    productService.getProducts(),
                    categoryService.getCategories(),
                ]);

                setProducts(Array.isArray(productData) ? productData : productData?.data || []);
                setCategoriesFromApi(Array.isArray(categoryData) ? categoryData : categoryData?.data || []);
            } catch (error) {
                console.error('Lỗi tải danh sách sản phẩm:', error);
                setProducts([]);
                setCategoriesFromApi([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const categories = useMemo(() => {
        const dynamicCategories = categoriesFromApi.map((cat) => ({
            key: cat.slug,
            name: cat.name,
            count: products.filter((product) => product.category?.slug === cat.slug).length,
        }));

        return [{ key: 'all', name: 'Tất cả', count: products.length }, ...dynamicCategories];
    }, [categoriesFromApi, products]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchCategory = category === 'all' || product.category?.slug === category;

            const matchSearch = !keyword || (product.name || '').toLowerCase().includes(keyword.toLowerCase());

            return matchCategory && matchSearch;
        });
    }, [products, category, keyword]);

    const sortedProducts = useMemo(() => {
        const cloned = [...filteredProducts];

        if (sort === 'price_asc') {
            cloned.sort((a, b) => {
                const aPrice = Number(a.variants?.[0]?.price || 0);
                const bPrice = Number(b.variants?.[0]?.price || 0);
                return aPrice - bPrice;
            });
        } else if (sort === 'price_desc') {
            cloned.sort((a, b) => {
                const aPrice = Number(a.variants?.[0]?.price || 0);
                const bPrice = Number(b.variants?.[0]?.price || 0);
                return bPrice - aPrice;
            });
        } else if (sort === 'rating') {
            cloned.sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0));
        } else if (sort === 'popular') {
            cloned.sort((a, b) => Number(b.review_count || 0) - Number(a.review_count || 0));
        }

        return cloned;
    }, [filteredProducts, sort]);

    const itemsPerPage = 9;
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedProducts = sortedProducts.slice(startIndex, endIndex);

    const updateURL = (key, value) => {
        const params = new URLSearchParams(searchParams);

        if (!value || value === 'all') {
            params.delete(key);
        } else {
            params.set(key, value);
        }

        params.set('page', '1');
        setSearchParams(params);
    };

    const handleCategoryChange = (newCategory) => {
        updateURL('category', newCategory);
    };

    const handleViewMode = (newViewMode) => {
        updateURL('viewmode', newViewMode);
    };

    const handleSortChange = (newSort) => {
        updateURL('sort', newSort);
    };

    const handlePageChange = (page) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(page));
        setSearchParams(params);
    };

    const handleClearFilters = () => {
        setSearchParams({});
    };

    return (
        <main className="bg-page px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={['Trang chủ', 'Sản phẩm']} to={['/', '/sanpham']} />

            <div className="max-w-7xl mx-auto pb-12 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* SIDEBAR */}
                    <aside className="hidden md:block md:col-span-1">
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg text-title">Bộ lọc</h3>
                                <button onClick={handleClearFilters} className="btn-link text-sm">
                                    Xóa tất cả
                                </button>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-medium mb-3 text-title">Danh mục</h4>
                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <label
                                            key={cat.key}
                                            className="flex items-center gap-2 cursor-pointer text-body"
                                        >
                                            <input
                                                type="radio"
                                                checked={category === cat.key}
                                                onChange={() => handleCategoryChange(cat.key)}
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                            <span className="text-sm flex-1">{cat.name}</span>
                                            <span className="text-xs text-muted">({cat.count})</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* PRODUCT LIST */}
                    <div className="md:col-span-3">
                        <div className="card p-2 md:mb-6 flex items-center justify-between gap-4 flex-wrap sticky top-0 z-30 bg-page">
                            <span className="text-sm text-muted">
                                Hiển thị{' '}
                                <span className="font-semibold text-title">
                                    {sortedProducts.length === 0 ? 0 : startIndex + 1}-
                                    {Math.min(endIndex, sortedProducts.length)}
                                </span>{' '}
                                của <span className="font-semibold text-title">{sortedProducts.length}</span> sản phẩm
                            </span>

                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="md:hidden btn-secondary flex items-center gap-2"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                <span className="hidden sm:block text-sm font-medium text-body">Bộ lọc</span>
                            </button>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex gap-2 items-center">
                                    <label className="hidden sm:block text-sm font-medium text-body">Sắp xếp:</label>
                                    <select
                                        value={sort}
                                        onChange={(e) => handleSortChange(e.target.value)}
                                        className="input-base text-sm"
                                    >
                                        <option value="popular">Phổ biến</option>
                                        <option value="price_asc">Giá: Thấp đến cao</option>
                                        <option value="price_desc">Giá: Cao đến thấp</option>
                                        <option value="rating">Đánh giá tốt nhất</option>
                                    </select>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleViewMode('grid')}
                                        className={`btn-toggle ${viewMode === 'grid' ? 'btn-toggle-active' : ''}`}
                                    >
                                        <Grid3x3 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleViewMode('list')}
                                        className={`btn-toggle ${viewMode === 'list' ? 'btn-toggle-active' : ''}`}
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 overflow-x-auto py-4 md:hidden">
                            {categories.map((cat) => (
                                <button
                                    key={cat.key}
                                    onClick={() => handleCategoryChange(cat.key)}
                                    className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                                        category === cat.key
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-body'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {keyword && (
                            <div className="-mt-2 mb-4 ms-2 text-sm text-muted">
                                Kết quả tìm kiếm cho:
                                <span className="font-semibold text-title ml-1">"{keyword}"</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-muted text-lg">Đang tải sản phẩm...</p>
                            </div>
                        ) : displayedProducts.length > 0 ? (
                            <div
                                className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
                            >
                                {displayedProducts.map((pro) => (
                                    <ProductCard key={pro.id} product={pro} viewMode={viewMode} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted text-lg">Không tìm thấy sản phẩm</p>
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-10 h-10 rounded-lg transition-colors ${
                                            page === safeCurrentPage ? 'btn-toggle btn-toggle-active' : 'btn-secondary'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isFilterOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />

                    <div className="w-80 max-w-full h-full bg-surface shadow-2xl animate-slide-in flex flex-col">
                        <div className="sticky top-0 z-10 bg-surface border-b border-default px-5 py-4 flex items-center justify-between">
                            <h3 className="font-semibold text-lg text-title">Bộ lọc</h3>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="text-muted hover:text-title text-sm"
                            >
                                Đóng
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-title mb-3">Danh mục</h4>

                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <label
                                            key={cat.key}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                                                category === cat.key
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                        category === cat.key ? 'border-blue-600' : 'border-gray-400'
                                                    }`}
                                                >
                                                    {category === cat.key && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                                    )}
                                                </div>

                                                <span className="text-sm text-body">{cat.name}</span>
                                            </div>

                                            <span className="text-xs text-muted">({cat.count})</span>

                                            <input
                                                type="radio"
                                                className="hidden"
                                                checked={category === cat.key}
                                                onChange={() => handleCategoryChange(cat.key)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-default p-4 space-y-3">
                            <button
                                onClick={() => {
                                    handleClearFilters();
                                    setIsFilterOpen(false);
                                }}
                                className="btn-secondary w-full"
                            >
                                Xóa bộ lọc
                            </button>

                            <button onClick={() => setIsFilterOpen(false)} className="btn-primary w-full">
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Products;
