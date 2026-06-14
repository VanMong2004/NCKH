import { useMemo, useState } from 'react';

export default function ProductGallery({ product }) {
    const images = useMemo(() => {
        const list = product.images?.length
            ? product.images.map((img) => img.url || img.image || img)
            : [product.image];

        return [...new Set(list.filter(Boolean))];
    }, [product]);

    const [activeImage, setActiveImage] = useState(images[0] || '/images/no-image.png');

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <img
                    src={activeImage}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                        e.currentTarget.src = '/images/no-image.png';
                    }}
                />
            </div>

            {images.length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
                    {images.map((image, index) => (
                        <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setActiveImage(image)}
                            className={`aspect-square rounded-xl border p-1 transition ${
                                activeImage === image
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
