export default function ShopHeader({ total = 0 }) {
    return (
        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-5 p-5 md:grid-cols-[1.4fr_0.6fr] md:p-8">
                <div>
                    <p className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                        Cửa hàng sinh viên
                    </p>

                    <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white md:text-4xl">
                        Mua sắm sản phẩm chính thức của nhà trường
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 md:text-base">
                        Khám phá đồng phục, phụ kiện, bảng tên và các sản phẩm theo chiến dịch dành cho sinh viên.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <div className="rounded-2xl bg-blue-50 px-4 py-3 dark:bg-blue-950/40">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng sản phẩm</p>
                            <p className="text-xl font-extrabold text-blue-950 dark:text-blue-300">{total}</p>
                        </div>

                        <div className="rounded-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Trạng thái</p>
                            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">Đang mở</p>
                        </div>
                    </div>
                </div>

                <div className="hidden items-center justify-center md:flex">
                    <div className="flex h-44 w-44 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
                        <img
                            src="/images/logo.png"
                            alt="Shop"
                            className="h-28 w-28 rounded-full object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
