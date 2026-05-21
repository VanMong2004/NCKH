import { Info, MapPin, Phone } from 'lucide-react';

export default function PickupGuide() {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold text-blue-950 dark:text-white">Hướng dẫn nhận hàng</h2>

            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <Guide icon={MapPin}>Nhận hàng tại điểm giao của cửa hàng hoặc theo địa chỉ đã đăng ký.</Guide>

                <Guide icon={Phone}>Vui lòng giữ liên lạc để nhân viên xác nhận đơn hàng khi cần.</Guide>

                <Guide icon={Info}>Mang theo thông tin đơn hàng khi đến nhận sản phẩm.</Guide>
            </div>
        </section>
    );
}

function Guide({ icon: Icon, children }) {
    return (
        <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                <Icon size={18} />
            </div>

            <p className="leading-6">{children}</p>
        </div>
    );
}
