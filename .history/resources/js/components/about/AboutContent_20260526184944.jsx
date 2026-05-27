import { CheckCircle2, Eye, Flag, Layers3, PackageCheck, Send, ShoppingBag } from 'lucide-react';

const PROCESS_STEPS = [
    {
        icon: ShoppingBag,
        title: 'Tìm sản phẩm hoặc chiến dịch',
        desc: 'Người dùng có thể xem sản phẩm, tin tức, chiến dịch và thông tin liên quan.',
    },
    {
        icon: PackageCheck,
        title: 'Đăng ký hoặc đặt hàng',
        desc: 'Hệ thống hỗ trợ đặt hàng, chọn biến thể và đăng ký tham gia chiến dịch.',
    },
    {
        icon: Send,
        title: 'Theo dõi và nhận thông báo',
        desc: 'Người dùng theo dõi trạng thái, thanh toán, nhận hàng và thông báo từ hệ thống.',
    },
];

export default function AboutContent({ about }) {
    return (
        <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-7">
                <InfoSection
                    icon={Flag}
                    label="Sứ mệnh"
                    title="Nền tảng hỗ trợ hoạt động số trong môi trường đại học"
                    content={about?.mission}
                    fallback="Xây dựng một nền tảng số giúp tối ưu quá trình đặt hàng, đăng ký chiến dịch, theo dõi giao dịch và nhận thông báo trong môi trường đại học."
                />

                <InfoSection
                    icon={Eye}
                    label="Tầm nhìn"
                    title="Kênh kết nối đáng tin cậy giữa nhà trường và người học"
                    content={about?.vision}
                    fallback="Trở thành kênh kết nối số đáng tin cậy giữa nhà trường, sinh viên và các hoạt động hỗ trợ cộng đồng học tập."
                />
            </div>

            <aside className="space-y-7">
                <FeatureBox />

                <ProcessBox />
            </aside>
        </section>
    );
}

function InfoSection({ icon: Icon, label, title, content, fallback }) {
    return (
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <Icon size={26} />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">
                        {label}
                    </p>

                    <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950 dark:text-white">{title}</h2>

                    <RichText
                        value={content || fallback}
                        className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base"
                    />
                </div>
            </div>
        </article>
    );
}

function FeatureBox() {
    const items = [
        'Quản lý sản phẩm và chiến dịch tập trung.',
        'Theo dõi đơn hàng, thanh toán và nhận hàng.',
        'Cập nhật tin tức, chính sách và FAQ rõ ràng.',
        'Hỗ trợ giao diện sáng/tối và trải nghiệm đa thiết bị.',
    ];

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Layers3 size={24} />
            </div>

            <h2 className="mt-4 text-lg font-black text-blue-950 dark:text-white">Điểm nổi bật</h2>

            <div className="mt-4 space-y-3">
                {items.map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ProcessBox() {
    return (
        <section className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:to-slate-900">
            <h2 className="text-lg font-black text-blue-950 dark:text-white">Quy trình sử dụng</h2>

            <div className="mt-5 space-y-4">
                {PROCESS_STEPS.map((step, index) => {
                    const Icon = step.icon;

                    return (
                        <div key={step.title} className="flex gap-3">
                            <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300">
                                    <Icon size={18} />
                                </div>

                                {index < PROCESS_STEPS.length - 1 ? (
                                    <div className="mx-auto mt-2 h-8 w-px bg-blue-200 dark:bg-blue-500/30" />
                                ) : null}
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-blue-950 dark:text-white">{step.title}</h3>

                                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function RichText({ value, className = '' }) {
    const text = String(value || '').trim();
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(text);

    if (!text) {
        return <p className={className}>Nội dung đang được cập nhật.</p>;
    }

    if (hasHtml) {
        return (
            <div
                className="prose prose-slate max-w-none prose-p:leading-7 prose-a:font-bold prose-a:text-blue-700 dark:prose-invert dark:prose-a:text-blue-300"
                dangerouslySetInnerHTML={{
                    __html: text,
                }}
            />
        );
    }

    return <p className={className}>{text}</p>;
}
