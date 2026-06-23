import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Autoplay, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import ProductCard from '../product/ProductCard';

import 'swiper/css';
import 'swiper/css/navigation';

export default function RelatedProducts({ products = [] }) {
    if (!products.length) {
        return (
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-4 text-lg font-bold text-blue-950 dark:text-white">Sản phẩm liên quan</h2>

                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    Chưa có sản phẩm liên quan.
                </div>
            </section>
        );
    }

    return (
        <section className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Sản phẩm liên quan</h2>

                {products.length > 1 && (
                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            className="related-prev flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-blue-950 transition hover:bg-blue-950 hover:text-white dark:border-slate-700 dark:text-white"
                            aria-label="Sản phẩm trước"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <button
                            type="button"
                            className="related-next flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-blue-950 transition hover:bg-blue-950 hover:text-white dark:border-slate-700 dark:text-white"
                            aria-label="Sản phẩm sau"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            <div className="min-w-0 overflow-hidden">
                <Swiper
                    modules={[Autoplay, Navigation]}
                    observer
                    observeParents
                    resizeObserver
                    watchOverflow
                    spaceBetween={16}
                    slidesPerView={2}
                    loop={false}
                    rewind={products.length > 4}
                    autoplay={
                        products.length > 4
                            ? {
                                  delay: 2400,
                                  disableOnInteraction: false,
                                  pauseOnMouseEnter: true,
                              }
                            : false
                    }
                    navigation={{
                        prevEl: '.related-prev',
                        nextEl: '.related-next',
                    }}
                    breakpoints={{
                        0: {
                            slidesPerView: 2,
                            spaceBetween: 12,
                        },
                        640: {
                            slidesPerView: 2,
                            spaceBetween: 14,
                        },
                        768: {
                            slidesPerView: 3,
                            spaceBetween: 16,
                        },
                        1024: {
                            slidesPerView: 4,
                            spaceBetween: 18,
                        },
                    }}
                    className="!overflow-hidden"
                >
                    {products.map((product) => (
                        <SwiperSlide key={product.id} className="!h-auto">
                            <div className="h-full">
                                <ProductCard product={product} />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}
