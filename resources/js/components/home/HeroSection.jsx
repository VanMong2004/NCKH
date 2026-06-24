import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Autoplay, Keyboard, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const STATIC_SLIDES = [
    {
        id: 'static-1',
        title: 'CTUT Shop',
        subtitle: 'Sản phẩm sinh viên CTUT',
        description: 'Khám phá đồng phục, phụ kiện, quà tặng và các sản phẩm dành cho sinh viên CTUT.',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1800',
        mobileImage: '',
    },
    {
        id: 'static-2',
        title: 'Sản phẩm mới mỗi ngày',
        subtitle: 'Cập nhật nhanh chóng',
        description: 'Theo dõi các mẫu áo, phụ kiện và sản phẩm mới nhất được cập nhật trên hệ thống.',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800',
        mobileImage: '',
    },
    {
        id: 'static-3',
        title: 'Mua sắm thuận tiện',
        subtitle: 'Đặt hàng dễ dàng',
        description: 'Chọn sản phẩm, thêm giỏ hàng, thanh toán và theo dõi đơn hàng ngay trên hệ thống.',
        image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1800',
        mobileImage: '',
    },
];

export default function HeroSection({ heroSlider }) {
    const slides = useMemo(() => {
        const apiSlides = Array.isArray(heroSlider?.slides)
            ? heroSlider.slides
                  .filter((item) => item?.image || item?.mobileImage)
                  .map((item) => ({
                        id: item.id || item.itemKey || item.item_key,
                        title: item.title || heroSlider?.title || 'CTUT Shop',
                        subtitle: item.subtitle || heroSlider?.subtitle || 'CTUT Shop',
                        description: item.content || item.description || heroSlider?.description || '',
                        image:
                            item.image ||
                            heroSlider?.backgroundImage ||
                            heroSlider?.background_image ||
                            '/images/no-image.png',
                        mobileImage:
                            item.mobileImage ||
                            item.mobile_image ||
                            heroSlider?.mobileBackgroundImage ||
                            heroSlider?.mobile_background_image ||
                            '',
                        // thêm
                        linkText: item.link_text || item.linkText || 'Xem cửa hàng',
                        linkUrl: item.link_url || item.linkUrl || '/shop',
                        // 
                  }))
            : [];

        // if (apiSlides.length >= 2) {
        //     return apiSlides;
        // }

        // if (apiSlides.length === 1) {
        //     return [apiSlides[0], ...STATIC_SLIDES.slice(1)];
        // }

        if (apiSlides.length >= 1) {
            return apiSlides;
        }

        if (heroSlider?.backgroundImage || heroSlider?.background_image) {
            return [
                {
                    id: 'hero-api-background',
                    title: heroSlider.title || 'CTUT Shop',
                    subtitle: heroSlider.subtitle || heroSlider.badge || 'CTUT Shop',
                    description: heroSlider.description || '',
                    image: heroSlider.backgroundImage || heroSlider.background_image,
                    mobileImage: heroSlider.mobileBackgroundImage || heroSlider.mobile_background_image || '',
                },
                ...STATIC_SLIDES.slice(1),
            ];
        }

        return STATIC_SLIDES;
    }, [heroSlider]);

    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-slate-950 shadow-sm dark:border-slate-800">
            <Swiper
                modules={[Autoplay, Navigation, Pagination, Keyboard]}
                slidesPerView={1}
                loop={slides.length > 1}
                speed={750}
                keyboard={{
                    enabled: true,
                }}
                autoplay={{
                    delay: 2000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                }}
                navigation={{
                    prevEl: '.hero-swiper-prev',
                    nextEl: '.hero-swiper-next',
                }}
                pagination={{
                    clickable: true,
                    el: '.hero-swiper-pagination',
                    bulletClass: 'hero-swiper-bullet',
                    bulletActiveClass: 'hero-swiper-bullet-active',
                }}
                className="hero-swiper h-[420px] sm:h-[500px] lg:h-[560px]"
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={slide.id || index}>
                        <div className="relative h-[420px] overflow-hidden sm:h-[500px] lg:h-[560px]">
                            <picture>
                                {slide.mobileImage && <source media="(max-width: 640px)" srcSet={slide.mobileImage} />}

                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = '/images/no-image.png';
                                    }}
                                />
                            </picture>

                            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-950/65 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                            <div className="absolute inset-0 z-20 flex items-center px-5 sm:px-8 lg:px-12">
                                <div className="max-w-3xl">
                                    <div className="inline-flex rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-sm backdrop-blur">
                                        {slide.subtitle || 'CTUT Shop'}
                                    </div>

                                    <h1 className="mt-5 text-3xl font-black leading-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
                                        {slide.title}
                                    </h1>

                                    {slide.description && (
                                        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                                            {slide.description}
                                        </p>
                                    )}

                                    <div className="mt-8">
                                        {/* <Link
                                            to="/shop"
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-blue-950 transition hover:bg-blue-50"
                                        >
                                            Xem cửa hàng
                                            <ArrowRight size={16} />
                                        </Link> */}
                                        <Link
                                            to={slide.linkUrl || '/shop'}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-blue-950 transition hover:bg-blue-50"
                                        >
                                            {slide.linkText || 'Xem cửa hàng'}
                                            <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <button
                type="button"
                className="hero-swiper-prev absolute left-4 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur transition hover:bg-black/40 md:flex"
                aria-label="Slide trước"
            >
                <ArrowLeft size={21} />
            </button>

            <button
                type="button"
                className="hero-swiper-next absolute right-4 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur transition hover:bg-black/40 md:flex"
                aria-label="Slide tiếp theo"
            >
                <ArrowRight size={21} />
            </button>

            <div className="hero-swiper-pagination absolute bottom-5 left-0 right-0 z-30 flex items-center justify-center gap-2" />

            <style>{`
                .hero-swiper-bullet {
                    width: 10px;
                    height: 10px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.45);
                    display: inline-block;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }

                .hero-swiper-bullet:hover {
                    background: rgba(255, 255, 255, 0.85);
                }

                .hero-swiper-bullet-active {
                    width: 36px;
                    background: #ffffff;
                }
            `}</style>
        </section>
    );
}
