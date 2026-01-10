import React, { useState } from "react";
import {
    ArrowRight,
    BadgePercent,
    ChevronLeft,
    ChevronRight,
    Cpu,
    Package,
    Palette,
    RefreshCcw,
    ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";
import CategoryCard from "../components/CategoryCard";
import Features from "../components/Features";
import ProductCard from "../components/ProductCard";
import mockCategory from "../data/mockCategory";
import mockProducts from "../data/mockProducts";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

function Home() {
    return (
        <main className="max-w-7xl mx-auto px-4">
            {/* Hero Section */}
            <section className="relative rounded-lg overflow-hidden">
                <div className="px-8 py-8 md:py-24">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded mb-3 md:mb-4">
                            NĂM HỌC MỚI
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 text-balance leading-tight">
                            Tự hào CTUT - Sáng tạo từ giảng đường
                        </h1>
                        <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-8 leading-relaxed">
                            Khám phá đồng phục, phụ kiện và những sản phẩm sáng
                            tạo của sinh viên CTUT.
                        </p>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm md:text-base">
                            Tất cả sản phẩm
                        </button>
                    </div>
                    <div className="absolute inset-0 w-full h-full object-cover">
                        <img
                            src="https://adduniform.com/wp-content/uploads/2020/09/banner-dong-phuc-hoc-sinh.png"
                            alt="Students in CTUT uniforms"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <Features
                        icon={
                            <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        }
                        title="Sản phẩm chính thức"
                        desc="Nguồn cung cấp trực tiếp từ nhà trường"
                    />
                    <Features
                        icon={
                            <BadgePercent className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        }
                        title="Giảm giá sinh viên"
                        desc="Ưu đãi đặc biệt dành cho người có thẻ sinh viên"
                    />
                    <Features
                        icon={
                            <RefreshCcw className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        }
                        title="Dễ dàng đổi trả"
                        desc="Đổi hàng trong vòng 30 ngày"
                    />
                </div>
            </section>

            {/* Danh mục */}
            <section className="py-8">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold">Danh mục</h2>
                    <Link
                        to="/categories"
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-xs md:text-sm font-medium"
                    >
                        Xem tất cả
                        <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {mockCategory.map((cat) => (
                        <CategoryCard
                            key={cat.id}
                            href={cat.href}
                            image={cat.image}
                            alt={cat.title}
                            title={cat.title}
                        />
                    ))}
                </div>
            </section>

            {/* Sản phẩm mới */}
            <section className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold">
                        Sản phẩm mới
                    </h2>
                    <div className="flex gap-2">
                        <button
                            className="swiper-prev p-2 border rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Previous"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            className="swiper-next p-2 border rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Next"
                        >
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
                {/* Thư viện Swiper giúp carosel và slider */}
                <div className="relative">
                    <Swiper
                        modules={[Autoplay, Navigation]}
                        navigation={{
                            prevEl: ".swiper-prev",
                            nextEl: ".swiper-next",
                        }}
                        autoplay={{
                            delay: 3000,
                            pauseOnMouseEnter: true,
                            disableOnInteraction: false,
                        }}
                        spaceBetween={20}
                        breakpoints={{
                            0: { slidesPerView: 2, slidesPerGroup: 2 },
                            768: { slidesPerView: 2, slidesPerGroup: 2 },
                            1024: { slidesPerView: 4, slidesPerGroup: 4 },
                        }}
                    >
                        {mockProducts.map((pro) => (
                            <SwiperSlide key={pro.id}>
                                <Link to={`/product/${pro.id}`}>
                                    <ProductCard
                                        image={pro.image[0]}
                                        title={pro.title}
                                        author={pro.author}
                                        price={pro.price}
                                        badge={pro.badge}
                                    />
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Sáng chế của sinh viên */}
            <section className="py-8">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
                    <div className="p-6 md:p-12 lg:p-16">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
                                Sáng chế của sinh viên
                            </h2>
                            <p className="text-xs md:text-sm text-gray-300 mb-6 md:mb-8 leading-relaxed">
                                Khám phá những sản phẩm độc đáo do sinh viên
                                CTUT đến từ nhiều khoa khác nhau thiết kế và
                                sáng tạo. Từ các mô hình in 3D đến các công tụ
                                phần mềm được phát triển theo yêu cầu.
                            </p>
                            <button className="bg-white text-gray-900 hover:bg-gray-100 font-medium px-6 py-2.5 rounded-lg border transition-colors text-sm md:text-base">
                                Khám phá các dự án
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-8">
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 md:p-6 text-center">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                                    <Cpu className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                                </div>
                                <h3 className="text-white font-semibold text-sm md:text-base">
                                    Electronics
                                </h3>
                            </div>
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 md:p-6 text-center">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                                    <Palette className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                                </div>
                                <h3 className="text-white font-semibold text-sm md:text-base">
                                    Design
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Home;
