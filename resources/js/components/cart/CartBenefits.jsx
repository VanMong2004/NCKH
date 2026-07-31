import { Headphones, PackageCheck, ShieldCheck, Truck } from 'lucide-react';

export default function CartBenefits() {
    const benefits = [
        {
            icon: ShieldCheck,
            title: 'Sản phẩm chính thức',
            desc: 'Sản phẩm được quản lý bởi hệ thống của Trường Đại học Kỹ thuật - Công nghệ Cần Thơ.',
        },
        {
            icon: PackageCheck,
            title: 'Tồn kho rõ ràng',
            desc: 'Số lượng được kiểm tra trước khi đặt hàng.',
        },
        {
            icon: Truck,
            title: 'Theo dõi đơn hàng',
            desc: 'Xem trạng thái xử lý sau khi thanh toán.',
        },
        {
            icon: Headphones,
            title: 'Hỗ trợ nhanh',
            desc: 'Tiếp nhận hỗ trợ trong quá trình mua hàng.',
        },
    ];

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold text-blue-950 dark:text-white">Cam kết hỗ trợ</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {benefits.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div key={item.title} className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                                <Icon size={20} />
                            </div>

                            <div>
                                <h3 className="font-bold text-blue-950 dark:text-white">{item.title}</h3>

                                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
