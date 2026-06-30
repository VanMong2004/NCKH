import { Sparkles } from 'lucide-react';

export default function BlogHero({ backgroundImage }) {
    const heroStyle = backgroundImage
        ? {
              backgroundImage: `url(${backgroundImage})`,
          }
        : undefined;

    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {backgroundImage ? (
                <div className="absolute inset-0 bg-cover bg-center opacity-90" style={heroStyle} />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-sky-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950" />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/30 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-950/35" />

            <div className="absolute -left-10 bottom-8 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-500/10" />
            <div className="absolute right-12 top-8 h-24 w-24 rounded-full bg-sky-200/60 blur-2xl dark:bg-sky-500/10" />

            <div className="relative min-h-[250px] px-6 py-10 sm:px-10 md:min-h-[290px] md:py-14">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm backdrop-blur dark:border-blue-500/20 dark:bg-slate-900/70 dark:text-blue-300">
                    <Sparkles size={14} />
                    Tin tức - Sự kiện - Khuyến mãi
                </div>

                <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight text-blue-950 dark:text-white md:text-5xl">
                    Tin tức, sự kiện & khuyến mãi
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                    Cập nhật những thông tin mới nhất về hoạt động, chương trình khuyến mãi và các bài viết nổi bật của
                    nhà trường.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                    <HeroStat value="24/7" label="Cập nhật" />
                    <HeroStat value="3+" label="Nhóm tin" />
                    <HeroStat value="Mới" label="Bài nổi bật" />
                </div>
            </div>
        </section>
    );
}

function HeroStat({ value, label }) {
    return (
        <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-lg font-black text-blue-950 dark:text-white">{value}</p>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}
