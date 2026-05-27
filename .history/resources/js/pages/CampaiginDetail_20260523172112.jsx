function Breadcrumb({ title }) {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 md:flex">
            <Home size={14} className="text-blue-950" />

            <ChevronRight size={14} />

            <span>Trang chủ</span>

            <ChevronRight size={14} />

            <span>Chiến dịch</span>

            <ChevronRight size={14} />

            <span className="text-blue-950">{title}</span>
        </div>
    );
}
