import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductImage({ images = [], badge }) {
    const normalizedImages = useMemo(() => {
        return images
            .map((img) => {
                if (typeof img === 'string') return img;
                return img?.url || '';
            })
            .filter(Boolean);
    }, [images]);

    const [selectedImage, setSelectedImage] = useState(0);

    const handlePrev = () => {
        if (normalizedImages.length === 0) return;
        setSelectedImage((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
    };

    const handleNext = () => {
        if (normalizedImages.length === 0) return;
        setSelectedImage((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
    };

    const currentImage = normalizedImages[selectedImage] || '/images/placeholder-product.jpg';

    return (
        <div className="space-y-4">
            <div className="relative bg-surface rounded-lg overflow-hidden h-96">
                <div className="relative w-full h-full">
                    <img
                        src={currentImage}
                        alt="Product"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-product.jpg';
                        }}
                    />
                </div>

                {!!badge && (
                    <div className="absolute top-4 left-4">
                        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">{badge}</span>
                    </div>
                )}

                {normalizedImages.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {normalizedImages.length > 1 && (
                <div className="flex gap-2">
                    {normalizedImages.map((image, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedImage(index)}
                            className={`w-24 h-24 rounded-lg overflow-hidden border-2 transition ${
                                selectedImage === index ? 'border-blue-500' : 'border-default'
                            }`}
                        >
                            <img
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = '/images/placeholder-product.jpg';
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
