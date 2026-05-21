import { PackageCheck, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';

export default function ProductBenefits() {
    const benefits = [
        {
            icon: ShieldCheck,
            title: 'Sản phẩm chính thức',
            desc: 'Được quản lý bởi hệ thống cửa hàng của nhà trường.',
        },
        {
            icon: PackageCheck,
            title: 'Tồn kho rõ ràng',
            desc: 'Hiển thị số lượng còn lại theo từng phân loại.',
        },
        {
            icon: Truck,
            title: 'Theo dõi đơn hàng',
            desc: 'Xem trạng thái xử lý trong mục đơn hàng cá nhân.',
        },
        {
            icon: RefreshCcw,
            title: 'Hỗ trợ đổi trả',
            desc: 'Tiếp nhận hỗ trợ theo chính sách của cửa hàng.',
        },
    ];

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.title}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                            <Icon size={20} />
                        </div>

                        <h3 className="font-bold text-blue-950 dark:text-white">{item.title}</h3>

                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                );
            })}
        </div>
    );
}
