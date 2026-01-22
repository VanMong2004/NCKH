"use client";

import React from "react";
import { useState } from "react";
import {
    Star,
    Heart,
    Truck,
    CheckCircle,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import mockProducts from "../data/mockProducts";
import { Link, useParams } from "react-router-dom";
import ReviewCard from "../components/ReviewCard";
import RatingSummary from "../components/RatingSummary";
import mockReviews from "../data/mockReviews";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import ProductCard from "../components/ProductCard";

export default function ProductDetail() {
    const { id } = useParams();
    const [selectedSize, setSelectedSize] = useState("L");
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState(0);
    const [showAll, setShowAll] = useState(false);

    const productId = mockProducts.find((item) => item.id === Number(id));
    if (!productId) {
        return (
            <h4 className="flex justify-center mt-8 text-gray-600">
                Không tìm thấy sản phẩm này
            </h4>
        );
    }

    //Sao
    const fullStars = Math.floor(productId.rating);
    const hasHalfStar = productId.rating % 1 !== 0;
    const totalStars = 5;

    //Reviews
    const displayedReviews = showAll ? mockReviews : mockReviews.slice(0, 2);

    return (
        <main className="px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <Breadcrumb
                items={["Trang chủ", "Danh mục", "Đồng phục"]}
                to={["/", "/danh-muc", "dong-phuc"]}
            />

            {/* Phần ảnh sản phẩm */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                <div className="space-y-4">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                        <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                            {productId.badge?.toLocaleUpperCase()}
                        </div>
                        <img
                            src={productId.image[mainImage]}
                            alt="Product"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Ảnh kèm */}
                    <div className="flex gap-3">
                        {productId.image.map((thumb, i) => (
                            <button
                                key={i}
                                onClick={() => setMainImage(i)}
                                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                                    mainImage === i
                                        ? "border-blue-500"
                                        : "border-gray-200"
                                }`}
                            >
                                <img
                                    src={thumb}
                                    alt={`Thumbnail ${i + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Phần thông tin sản phẩm */}
                <div className="space-y-6">
                    {/* Tên sản phẩm và đánh giá sản phẩm*/}
                    <div>
                        <h1 className="text-3xl font-bold mb-3">
                            {productId.title}
                        </h1>
                        <div className="flex items-center gap-2 mb-4">
                            {/* Đánh giá sao */}
                            <div className="flex gap-1">
                                {[...Array(fullStars)].map((_, i) => (
                                    <Star
                                        key={`full-${i}`}
                                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                                    />
                                ))}

                                {hasHalfStar && (
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 opacity-50" />
                                )}

                                {[
                                    ...Array(
                                        totalStars -
                                            fullStars -
                                            (hasHalfStar ? 1 : 0),
                                    ),
                                ].map((_, i) => (
                                    <Star
                                        key={`empty-${i}`}
                                        className="w-5 h-5 text-gray-300"
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-600">
                                {`(${productId.reviewCount} đánh giá)`}
                            </span>
                            {productId.inStock ? (
                                <span className="text-green-600 text-sm font-semibold">
                                    ● Còn hàng
                                </span>
                            ) : (
                                <span className="text-red-600 text-sm font-semibold">
                                    ● Hết hàng
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Giá */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-bold">
                                {productId.price.toLocaleString("vi-VN")}₫
                            </span>
                            <span className="text-xl text-gray-400 line-through">
                                {productId.originalPrice.toLocaleString(
                                    "vi-VN",
                                )}
                                ₫
                            </span>
                            {productId.discount && (
                                <span className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm font-semibold">
                                    {productId.discount}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Mô tả sản phẩm */}
                    <p className="text-gray-700 leading-relaxed">
                        {productId.desc}
                    </p>

                    {/* Phần hướng dẫn chọn size */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="font-semibold">Chọn size</label>
                            <a
                                href="#"
                                className="text-blue-500 text-sm hover:underline"
                            >
                                📐 Hướng dẫn chọn size
                            </a>
                        </div>
                        <div className="flex gap-3">
                            {productId.sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`w-12 h-12 rounded border-2 font-semibold transition ${
                                        selectedSize === size
                                            ? "border-blue-500 bg-blue-50 text-blue-600"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Số lượng và Thêm giỏ */}
                    <div className="flex items-center gap-4">
                        {/* Số lượng */}
                        <div className="flex items-center border border-gray-300 rounded">
                            <button
                                onClick={() =>
                                    setQuantity(Math.max(1, quantity - 1))
                                }
                                className="px-3 py-2 hover:bg-gray-100 text-gray-600"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) =>
                                    setQuantity(
                                        Math.max(
                                            1,
                                            Number.parseInt(e.target.value) ||
                                                1,
                                        ),
                                    )
                                }
                                className="w-12 text-center border-l border-r border-gray-300 outline-none"
                            />
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="px-3 py-2 hover:bg-gray-100 text-gray-600"
                            >
                                +
                            </button>
                        </div>
                        {/* Thêm giỏ */}
                        <button className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 flex items-center justify-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            Thêm vào giỏ
                        </button>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-blue-500" />
                            <div className="text-sm">
                                <p className="font-semibold">
                                    Free Campus Pickup
                                </p>
                                <p className="text-gray-500 text-xs">
                                    Available at Building C1
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div className="text-sm">
                                <p className="font-semibold">
                                    Authentic Uniform
                                </p>
                                <p className="text-gray-500 text-xs">
                                    Official University Gear
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Đánh giá */}
            <section>
                <h2 className="text-2xl font-bold mb-6">Đánh giá</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg p-6 border">
                            <RatingSummary />
                        </div>
                    </div>

                    <div className="md:col-span-2 mb-4">
                        <div className="space-y-4">
                            {displayedReviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                        </div>

                        {!showAll && mockReviews.length > 2 && (
                            <div className="py-6 text-center">
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    Xem tất cả {mockReviews.length} đánh giá
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Sản phẩm liên quan */}
            <section className="mx-auto px-4 py-8 md:py-12">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold">
                        Sản phẩm liên quan
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
                                <Link
                                    to={`/product/${pro.id}`}
                                    onClick={() =>
                                        window.scrollTo({
                                            top: 0,
                                            behavior: "smooth",
                                        })
                                    }
                                >
                                    <ProductCard product={pro} />
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>
        </main>
    );
}
