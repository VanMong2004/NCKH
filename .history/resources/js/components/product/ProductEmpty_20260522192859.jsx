<div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
        <PackageSearch size={40} className="text-blue-950 dark:text-blue-300" />
    </div>

    <h3 className="mt-5 text-xl font-extrabold text-blue-950 dark:text-white">Không tìm thấy sản phẩm</h3>

    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Thử thay đổi từ khóa hoặc bộ lọc.</p>

    <Link to="/shop" className="mt-6 inline-flex rounded-xl bg-blue-950 px-6 py-3 text-sm font-bold text-white">
        Quay lại cửa hàng
    </Link>
</div>;
