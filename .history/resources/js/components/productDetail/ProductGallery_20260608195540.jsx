import { useMemo, useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

export default function ProductGallery({ product }) {
    const images = useMemo(() => {
        const list = product.images?.length
            ? product.images.map((img) => img.url || img.image || img)
            : [product.image];

        return [...new Set(list.filter(Boolean))];
    }, [product]);

    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* FIX: phải có wrapper + overflow + aspect-square */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800 min-h-0">
                <Swiper
                    modules={[Navigation]}
                    navigation
                    onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                    initialSlide={0}
                    className="w-full h-full"
                >
                    {images.map((image, index) => (
                        <SwiperSlide key={`${image}-${index}`} className="flex items-center justify-center">
                            <img
                                src={image}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                    e.currentTarget.src = '/images/no-image.png';
                                }}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* THUMBNAILS GIỮ NGUYÊN */}
            {images.length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
                    {images.map((image, index) => (
                        <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={`aspect-square rounded-xl border p-1 transition ${
                                activeIndex === index
                                    ? 'border-blue-950 dark:border-blue-400'
                                    : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'
                            }`}
                        >
                            <img
                                src={image}
                                alt={`${product.name} ${index + 1}`}
                                className="h-full w-full rounded-lg object-contain"
                                onError={(e) => {
                                    e.currentTarget.src = '/images/no-image.png';
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
