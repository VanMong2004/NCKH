import { Images, Sparkles } from 'lucide-react';

const FALLBACK_IMAGES = [
    '/images/system/Rectangle_3897.jpg',
    '/images/system/Rectangle_3897.jpg',
    '/images/system/Rectangle_3897.jpg',
];

export default function AboutGallery({ images = [] }) {
    const displayImages = images.length > 0 ? images : FALLBACK_IMAGES;

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        <Images size={13} />
                        Hình ảnh
                    </div>

                    <h2 className="mt-3 text-2xl font-black text-blue-950 dark:text-white">Không gian hoạt động</h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Một số hình ảnh giới thiệu về hệ thống, hoạt động và môi trường kết nối người dùng.
                    </p>
                </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                {displayImages.slice(0, 3).map((image, index) => (
                    <GalleryImage key={`${image}-${index}`} image={image} index={index} />
                ))}
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 dark:bg-slate-950 dark:text-blue-300">
                        <Sparkles size={19} />
                    </div>

                    <div>
                        <h3 className="text-sm font-black text-blue-950 dark:text-white">
                            Cập nhật hình ảnh từ hệ thống
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Nếu backend có dữ liệu gallery, giao diện sẽ tự động hiển thị ảnh từ database. Nếu chưa có,
                            hệ thống dùng ảnh mặc định để tránh trống layout.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function GalleryImage({ image, index }) {
    const heights = ['h-72', 'h-56 md:mt-10', 'h-72'];

    return (
        <div
            className={[
                'group overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-sm dark:bg-slate-800',
                heights[index] || 'h-64',
            ].join(' ')}
        >
            <img
                src={image}
                alt={`Hình ảnh giới thiệu ${index + 1}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
            />
        </div>
    );
}
