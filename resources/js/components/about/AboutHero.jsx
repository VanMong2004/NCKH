import { ArrowRight, Building2, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const FALLBACK = {
    title: 'CTUT Shop',
    slogan: 'Kết nối sinh viên với các sản phẩm, khuyến mãi và hoạt động của trường',
    banner: '/images/system/Rectangle_3897.jpg',
    description:
        'CTUT Shop là hệ thống hỗ trợ sinh viên, giảng viên và người dùng tiếp cận các sản phẩm, khuyến mãi, sự kiện và thông tin chính thức của nhà trường một cách thuận tiện, minh bạch và hiện đại.',
};

export default function AboutHero({ about }) {
    const data = {
        ...FALLBACK,
        ...(about || {}),
    };

    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{
                    backgroundImage: `url(${data.banner})`,
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/35 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-950/40" />

            <div className="absolute -left-10 bottom-8 h-44 w-44 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-500/10" />
            <div className="absolute right-12 top-8 h-28 w-28 rounded-full bg-sky-200/60 blur-2xl dark:bg-sky-500/10" />

            <div className="relative grid min-h-[360px] gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:py-14">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700 shadow-sm backdrop-blur dark:border-blue-500/20 dark:bg-slate-900/70 dark:text-blue-300">
                        <Sparkles size={14} />
                        Giới thiệu hệ thống
                    </div>

                    <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-blue-950 dark:text-white md:text-5xl">
                        {data.title}
                    </h1>

                    <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-blue-700 dark:text-blue-300">
                        {data.slogan}
                    </p>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                        {data.description}
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/shop"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            Khám phá sản phẩm
                            <ArrowRight size={16} />
                        </Link>

                        <Link
                            to="/contact"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-5 text-sm font-black text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/20 dark:bg-slate-900/80 dark:text-blue-300 dark:hover:bg-blue-500/10"
                        >
                            Liên hệ hỗ trợ
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                <div className="grid gap-3">
                    <HeroMiniCard
                        icon={Building2}
                        title="Nền tảng số"
                        desc="Quản lý sản phẩm, khuyến mãi và thông tin hỗ trợ trên cùng một hệ thống."
                    />

                    <HeroMiniCard
                        icon={GraduationCap}
                        title="Phục vụ sinh viên"
                        desc="Hỗ trợ sinh viên tiếp cận thông tin và đăng ký hoạt động thuận tiện hơn."
                    />

                    <HeroMiniCard
                        icon={ShieldCheck}
                        title="Minh bạch dữ liệu"
                        desc="Theo dõi đơn hàng, giao dịch, thông báo và lịch sử xử lý rõ ràng."
                    />
                </div>
            </div>
        </section>
    );
}

function HeroMiniCard({ icon: Icon, title, desc }) {
    return (
        <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
            <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <Icon size={21} />
                </div>

                <div>
                    <h3 className="text-sm font-black text-blue-950 dark:text-white">{title}</h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{desc}</p>
                </div>
            </div>
        </div>
    );
}
