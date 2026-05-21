import { Headphones, PackageCheck, ShieldCheck, Truck } from 'lucide-react';

export default function ShopFeatures() {
    const features = [
        {
            icon: ShieldCheck,
            title: 'Sản phẩm chính thức',
            desc: 'Thông tin sản phẩm được quản lý bởi hệ thống của nhà trường.',
        },
        {
            icon: PackageCheck,
            title: 'Kiểm tra tồn kho',
            desc: 'Hiển thị tình trạng còn hàng để hỗ trợ đặt mua chính xác.',
        },
        {
            icon: Truck,
            title: 'Theo dõi đơn hàng',
            desc: 'Sinh viên có thể xem trạng thái xử lý đơn hàng trong tài khoản.',
        },
        {
            icon: Headphones,
            title: 'Hỗ trợ nhanh',
            desc: 'Tiếp nhận thông tin hỗ trợ trong quá trình mua hàng.',
        },
    ];

    return (
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.title}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                            <Icon size={22} />
                        </div>

                        <h3 className="font-bold text-blue-950 dark:text-white">{item.title}</h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                );
            })}
        </section>
    );
}
