import { useEffect, useMemo, useRef, useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

const FALLBACK_IMAGE = '/images/no-image.png';

function normalizeImage(value) {
    let image = '';

    if (!value) return '';

    if (typeof value === 'string') {
        image = value.trim();
    } else {
        image = value.url || value.image || value.path || '';
    }

    if (!image) return '';

    if (
        image.startsWith('http://') ||
        image.startsWith('https://') ||
        image.startsWith('/') ||
        image.startsWith('data:image') ||
        image.startsWith('blob:')
    ) {
        return image;
    }

    return `/${image.replace(/^public\//, '')}`;
}

export default function ProductGallery({ product }) {
    const swiperRef = useRef(null);

    const images = useMemo(() => {
        const productImages = Array.isArray(product.images)
            ? product.images.map(normalizeImage)
            : [];

        const list = productImages.length
            ? productImages
            : [
                normalizeImage(product.image || product.thumbnail),
            ];

        const uniqueImages = [...new Set(list.filter(Boolean))];

        return uniqueImages.length ? uniqueImages : [FALLBACK_IMAGE];
    }, [product]);

    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        setActiveIndex(0);

        if (swiperRef.current) {
            swiperRef.current.slideTo(0, 0);
        }
    }, [images]);

    function handleSelectImage(index) {
        setActiveIndex(index);

        if (swiperRef.current) {
            swiperRef.current.slideTo(index);
        }
    }

    function handleImageError(event) {
        event.currentTarget.src = FALLBACK_IMAGE;
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
                <div className="aspect-square w-full">
                    <Swiper
                        modules={[Navigation]}
                        navigation={images.length > 1}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                        onSlideChange={(swiper) => {
                            setActiveIndex(swiper.activeIndex);
                        }}
                        className="h-full w-full product-detail-gallery"
                    >
                        {images.map((image, index) => (
                            <SwiperSlide key={`${image}-${index}`} className="!flex h-full items-center justify-center">
                                <div className="flex h-full w-full items-center justify-center p-3 sm:p-5">
                                    <img
                                        src={image}
                                        alt={`${product.name || 'Sản phẩm'} ${index + 1}`}
                                        className="block h-full w-full object-contain"
                                        draggable={false}
                                        onError={handleImageError}
                                    />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {images.length > 1 && (
                    <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-950/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        {activeIndex + 1}/{images.length}
                    </div>
                )}
            </div>

            {images.length > 1 && (
                <div className="mt-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {images.map((image, index) => {
                            const active = activeIndex === index;

                            return (
                                <button
                                    key={`${image}-${index}`}
                                    type="button"
                                    onClick={() => handleSelectImage(index)}
                                    className={[
                                        'group h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white p-1 transition dark:bg-slate-950 sm:h-24 sm:w-24',
                                        active
                                            ? 'border-blue-950 ring-2 ring-blue-950/15 dark:border-blue-400 dark:ring-blue-400/20'
                                            : 'border-slate-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-500',
                                    ].join(' ')}
                                    aria-label={`Xem ảnh ${index + 1}`}
                                >
                                    <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-900">
                                        <img
                                            src={image}
                                            alt={`${product.name || 'Sản phẩm'} thumbnail ${index + 1}`}
                                            className="h-full w-full object-contain p-1 transition duration-200 group-hover:scale-105"
                                            draggable={false}
                                            onError={handleImageError}
                                        />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
