import { CheckCircle, ChevronLeft, ChevronRight, ShoppingCart, Truck } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Autoplay, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import Breadcrumb from '../components/common/Breadcrumb';
import ProductCard from '../components/common/ProductCard';
import RatingSummary from '../components/product/RatingSummary';
import ReviewCard from '../components/product/ReviewCard';
import StarRating from '../components/product/StarRating';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { mockProducts } from '../data/mockProducts';
import { mockReviews } from '../data/mockReviews';

export default function ProductDetail() {
    const { addToCart } = useCart();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState(0);
    const [showAll, setShowAll] = useState(false);

    const productId = mockProducts.find((item) => item.id === Number(id));
    if (!productId) {
        return <h4 className="flex justify-center mt-8 text-muted">Không tìm thấy sản phẩm này</h4>;
    }

    const displayedReviews = showAll ? mockReviews : mockReviews.slice(0, 2);

    const canAddToCart = productId.inStock && (!productId.hasSize || !!selectedSize);

    const handleAddToCart = () => {
        if (!user) {
            navigate('/auth/dangnhap', {
                state: { from: location.pathname },
            });
            return;
        }
        addToCart(productId, selectedSize, quantity);
    };

    return (
        <main className="bg-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <Breadcrumb items={['Trang chủ', 'Sản phẩm']} to={['/', '/sanpham']} />

            {/* Product main section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4 mt-4">
                {/* Images */}
                <div className="space-y-4">
                    <div className="relative bg-surface rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                        <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                            {productId.badge?.toLocaleUpperCase()}
                        </div>
                        <img src={productId.image[mainImage]} alt="Product" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex gap-3">
                        {productId.image.map((thumb, i) => (
                            <button
                                key={i}
                                onClick={() => setMainImage(i)}
                                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                                    mainImage === i ? 'border-blue-500' : 'border-default'
                                }`}
                            >
                                <img src={thumb} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-3 text-title">{productId.name}</h1>
                        <div className="flex items-center gap-2 mb-4">
                            <StarRating rating={productId.rating} />
                            <span className="text-sm text-muted">({productId.reviewCount} đánh giá)</span>
                            {productId.inStock ? (
                                <span className="text-green-600 text-sm font-semibold">● Còn hàng</span>
                            ) : (
                                <span className="text-red-600 text-sm font-semibold">● Hết hàng</span>
                            )}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-bold text-title">
                                {productId.price.toLocaleString('vi-VN')}₫
                            </span>
                            <span className="text-xl text-muted line-through">
                                {productId.originalPrice.toLocaleString('vi-VN')}₫
                            </span>
                            {productId.discount && <span className="badge badge-error">{productId.discount}</span>}
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-body leading-relaxed">{productId.desc}</p>

                    {/* Size */}
                    {productId.hasSize && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-title">Chọn size</label>
                                <a href="#" className="btn-link text-sm">
                                    📐 Hướng dẫn chọn size
                                </a>
                            </div>
                            <div className="flex gap-3">
                                {productId.sizes.map((size) => (
                                    <button
                                        key={size}
                                        disabled={!productId.inStock}
                                        onClick={() => setSelectedSize(size)}
                                        className={`w-12 h-12 rounded border-2 font-semibold transition ${
                                            selectedSize === size
                                                ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                : 'border-default text-body hover:border-gray-300'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity & Add to cart */}
                    <div className="flex flex-col gap-4 md:gap-5">
                        {/* Quantity */}
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
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 text-center border-l border-r h-10 bg-transparent outline-none text-title"
                            />

                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="px-4 py-2 text-muted hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                +
                            </button>
                        </div>

                        {/* Buttons */}
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
                                onClick={() => {
                                    handleAddToCart();
                                    navigate('/giohang');
                                }}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Mua ngay
                            </button>
                        </div>
                    </div>

                    {/* Features */}
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

            {/* Reviews */}
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

            {/* Related products */}
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
