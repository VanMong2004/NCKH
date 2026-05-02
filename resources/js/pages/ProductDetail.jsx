import { CheckCircle, ChevronLeft, ChevronRight, ShoppingCart, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Autoplay, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import Breadcrumb from '../components/common/Breadcrumb';
import ProductCard from '../components/common/ProductCard';
import ProductImage from '../components/product/ProductImage';
import RatingSummary from '../components/product/RatingSummary';
import ReviewCard from '../components/product/ReviewCard';
import StarRating from '../components/product/StarRating';
import { useCart } from '../context/CartContext';

import productService from '../services/productService';
import { mockReviews } from '../data/mockReviews';
import { mockProducts } from '../data/mockProducts';

export default function ProductDetail() {
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await productService.getProductById(id);
                setProduct(data);
            } catch (error) {
                console.error('Lỗi lấy chi tiết sản phẩm:', error);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const variants = product?.variants || [];

    useEffect(() => {
        if (!product) return;

        if (variants.length > 1 && !selectedSize) {
            const firstAvailableVariant = variants.find((variant) => Number(variant.stock || 0) > 0);

            if (firstAvailableVariant?.size) {
                setSelectedSize(firstAvailableVariant.size);
            }
        }
    }, [product, variants, selectedSize]);

    const availableSizes = useMemo(() => {
        const sizes = variants.map((variant) => variant.size).filter(Boolean);
        return [...new Set(sizes)];
    }, [variants]);

    const selectedVariant = useMemo(() => {
        if (!product) return null;

        if (variants.length === 1) {
            return variants[0];
        }

        if (selectedSize) {
            return variants.find((variant) => variant.size === selectedSize) || null;
        }

        return null;
    }, [product, variants, selectedSize]);

    const displayedReviews = showAll ? mockReviews : mockReviews.slice(0, 2);

    const isInStock = selectedVariant
        ? Number(selectedVariant.stock || 0) > 0
        : variants.some((variant) => Number(variant.stock || 0) > 0);

    const canAddToCart = !!product && !!selectedVariant && isInStock;

    const fallbackVariant = variants[0] || null;
    const currentPrice = Number(selectedVariant?.price ?? fallbackVariant?.price ?? 0);

    const handleAddToCart = async () => {
        if (!product) return;
        await addToCart(product, selectedSize, quantity);
    };

    const handleBuyNow = async () => {
        if (!product) return;
        await handleAddToCart();
        navigate('/giohang');
    };

    if (loading) {
        return <h4 className="flex justify-center mt-8 text-muted">Đang tải sản phẩm...</h4>;
    }

    if (!product) {
        return <h4 className="flex justify-center mt-8 text-muted">Không tìm thấy sản phẩm này</h4>;
    }

    return (
        <main className="bg-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={['Trang chủ', 'Sản phẩm']} to={['/', '/sanpham']} />

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4 mt-4">
                <ProductImage images={product.images || []} badge={product.badge} />

                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-3 text-title">{product.name}</h1>

                        <div className="flex items-center gap-2 mb-4">
                            <StarRating rating={product.avg_rating || 0} />
                            <span className="text-sm text-muted">({product.review_count || 0} đánh giá)</span>

                            {isInStock ? (
                                <span className="text-green-600 text-sm font-semibold">● Còn hàng</span>
                            ) : (
                                <span className="text-red-600 text-sm font-semibold">● Hết hàng</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-bold text-title">
                                {Number(currentPrice).toLocaleString('vi-VN')}₫
                            </span>
                        </div>
                    </div>

                    <p className="text-body leading-relaxed">{product.description}</p>

                    {availableSizes.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-title">Chọn size</label>
                            </div>

                            <div className="flex gap-3">
                                {availableSizes.map((size) => {
                                    const variantOfSize = variants.find((variant) => variant.size === size);
                                    const disabled = !variantOfSize || Number(variantOfSize.stock || 0) <= 0;

                                    return (
                                        <button
                                            key={size}
                                            disabled={disabled}
                                            onClick={() => setSelectedSize(size)}
                                            className={`w-12 h-12 rounded border-2 font-semibold transition ${
                                                selectedSize === size
                                                    ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'border-default text-body hover:border-gray-300'
                                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 md:gap-5">
                        <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded w-fit">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-4 py-2 text-muted hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                −
                            </button>

                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-16 text-center border-l border-r h-10 bg-transparent outline-none text-title"
                            />

                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="px-4 py-2 text-muted hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                +
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button
                                type="button"
                                disabled={!canAddToCart}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                                onClick={handleAddToCart}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Thêm vào giỏ
                            </button>

                            <button
                                type="button"
                                disabled={!canAddToCart}
                                className="btn-danger w-full py-3 flex items-center justify-center gap-2"
                                onClick={handleBuyNow}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Mua ngay
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2 border-default p-4">
                            <Truck className="w-5 h-5 text-blue-500" />
                            <div className="text-sm">
                                <p className="font-semibold text-title">Free Campus Pickup</p>
                                <p className="text-muted text-xs">Available at Building C1</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border-default p-4">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div className="text-sm">
                                <p className="font-semibold text-title">Authentic Uniform</p>
                                <p className="text-muted text-xs">Official University Gear</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-6 text-title">Đánh giá</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <div className="card p-6">
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
                                <button onClick={() => setShowAll(true)} className="btn-link">
                                    Xem tất cả {mockReviews.length} đánh giá
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="mx-auto px-4 py-8 md:py-12">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-title">Sản phẩm liên quan</h2>
                    <div className="flex gap-2">
                        <button className="btn-secondary swiper-prev p-2">
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button className="btn-secondary swiper-next p-2">
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>

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
                        0: { slidesPerView: 2, slidesPerGroup: 2 },
                        768: { slidesPerView: 2, slidesPerGroup: 2 },
                        1024: { slidesPerView: 4, slidesPerGroup: 4 },
                    }}
                >
                    {mockProducts.map((pro) => (
                        <SwiperSlide key={pro.id}>
                            <ProductCard product={pro} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>
        </main>
    );
}
