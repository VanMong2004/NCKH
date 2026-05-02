import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgePercent, ChevronLeft, ChevronRight, Cpu, Package, Palette, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import CategoryCard from '../components/home/CategoryCard';
import Features from '../components/home/Features';
import ProductCard from '../components/common/ProductCard';

import categoryService from '../services/categoryService';
import productService from '../services/productService';

import bannerImg from '../../images/imgBanner.png';

function Home() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoading(true);

                const [categoryData, productData] = await Promise.all([
                    categoryService.getCategories(),
                    productService.getProducts(),
                ]);

                const categoryList = Array.isArray(categoryData) ? categoryData : categoryData?.data || [];
                const productList = Array.isArray(productData) ? productData : productData?.data || [];

                setCategories(categoryList);
                setProducts(productList);
            } catch (error) {
                console.error('Lỗi tải dữ liệu trang chủ:', error);
                setCategories([]);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    // Lấy 4 danh mục đầu tiên
    const displayedCategories = categories.slice(0, 4);

    // Gợi ý: sản phẩm mới = sản phẩm mới tạo gần nhất
    const newestProducts = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 12);

    return (
        <main className="bg-page max-w-7xl mx-auto px-4 pt-8">
            {/* HERO */}
            <section className="relative rounded-lg overflow-hidden min-h-[400px] md:min-h-[500px]">
                <div className="px-8 py-8 md:py-24">
                    <div className="absolute inset-0">
                        <img src={bannerImg} alt="Students in CTUT uniforms" className="w-full h-full object-cover" />
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <Features
                        icon={<Package className="w-6 h-6 text-blue-600" />}
                        title="Sản phẩm chính thức"
                        desc="Nguồn cung cấp trực tiếp từ nhà trường"
                    />
                    <Features
                        icon={<BadgePercent className="w-6 h-6 text-blue-600" />}
                        title="Giảm giá sinh viên"
                        desc="Ưu đãi đặc biệt dành cho người có thẻ sinh viên"
                    />
                    <Features
                        icon={<RefreshCcw className="w-6 h-6 text-blue-600" />}
                        title="Dễ dàng đổi trả"
                        desc="Đổi hàng trong vòng 30 ngày"
                    />
                </div>
            </section>

            {/* CATEGORY */}
            <section className="py-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-title text-2xl md:text-3xl font-bold">Danh mục</h2>

                    <Link to="/sanpham" className="btn-link flex items-center gap-2 text-sm">
                        Xem tất cả
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="text-muted">Đang tải danh mục...</div>
                ) : displayedCategories.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {displayedCategories.map((cat) => (
                            <CategoryCard key={cat.id} id={cat.id} name={cat.name} slug={cat.slug} />
                        ))}
                    </div>
                ) : (
                    <div className="text-muted">Chưa có danh mục</div>
                )}
            </section>

            {/* NEW PRODUCTS */}
            <section className="py-8 md:py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-title text-2xl md:text-3xl font-bold">Sản phẩm mới</h2>

                    <div className="flex gap-2">
                        <button className="btn-secondary swiper-prev p-2">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button className="btn-secondary swiper-next p-2">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-muted">Đang tải sản phẩm...</div>
                ) : newestProducts.length > 0 ? (
                    <Swiper
                        modules={[Autoplay, Navigation]}
                        navigation={{
                            prevEl: '.swiper-prev',
                            nextEl: '.swiper-next',
                        }}
                        autoplay={{
                            delay: 3000,
                            pauseOnMouseEnter: true,
                            disableOnInteraction: false,
                        }}
                        spaceBetween={20}
                        breakpoints={{
                            0: { slidesPerView: 2 },
                            768: { slidesPerView: 2 },
                            1024: { slidesPerView: 4 },
                        }}
                    >
                        {newestProducts.map((pro) => (
                            <SwiperSlide key={pro.id}>
                                <ProductCard product={pro} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <div className="text-muted">Chưa có sản phẩm</div>
                )}
            </section>

            {/* STUDENT PROJECTS */}
            <section className="py-8">
                <div className="rounded-lg overflow-hidden bg-gray-900 border-default">
                    <div className="p-6 md:p-12 lg:p-16">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl font-bold text-white mb-4">Sáng chế của sinh viên</h2>

                            <p className="text-sm text-gray-300 mb-6">
                                Khám phá những sản phẩm độc đáo do sinh viên CTUT thiết kế và sáng tạo.
                            </p>

                            <button className="bg-white hover:opacity-80 border-default font-semibold rounded-lg px-6 py-2.5">
                                Khám phá các dự án
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="card p-6 text-center">
                                <Cpu className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                <h3 className="text-title font-semibold">Electronics</h3>
                            </div>

                            <div className="card p-6 text-center">
                                <Palette className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                <h3 className="text-title font-semibold">Design</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Home;
