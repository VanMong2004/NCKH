export default function BlogHero() {
    return (
        <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-100 px-6 py-10 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950 sm:px-10 sm:py-14">
            <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-slate-900 dark:text-blue-300">
                    Tin tức CTUT UniShop
                </span>

                <h1 className="mt-5 text-4xl font-black leading-tight text-blue-950 dark:text-white sm:text-5xl">
                    Hướng dẫn, thông báo và tin tức mới nhất
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                    Cập nhật các bài viết hướng dẫn đặt hàng, thanh toán, nhận hàng, xuất hóa đơn và thông báo mới từ CTUT UniShop.
                </p>
            </div>
        </section>
    );
}
