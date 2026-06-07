import AuthHeader from './AuthHeader';
import Footer from '../layout/Footer';

export default function AuthLayout({
    children,
    title,
    description,
    question,
    linkText,
    linkHref,
    showInfoCard = false,
}) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <AuthHeader question={question} linkText={linkText} linkHref={linkHref} />

            <main className="bg-blue-50 dark:bg-slate-950">
                <div className="mx-auto grid min-h-[720px] max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1fr_560px] md:items-center">
                    <section
                        className="relative hidden min-h-[620px] overflow-hidden rounded-2xl md:block"
                        style={{
                            backgroundImage: "url('/images/bg-sign.png')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'first',
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/20 to-blue-50/80 dark:from-slate-950/80 dark:via-slate-900/60 dark:to-slate-950/80" />

                        <div className="relative z-10 p-12">
                            <h2 className="max-w-md text-4xl font-extrabold leading-tight text-blue-950 dark:text-white">
                                {title}
                            </h2>

                            <p className="mt-5 max-w-md text-lg text-slate-600 dark:text-slate-300">{description}</p>

                            <div className="mt-6 h-1 w-16 rounded-full bg-blue-950 dark:bg-blue-400" />

                            {showInfoCard && (
                                <div className="mt-72 max-w-xs rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur dark:bg-slate-900/90">
                                    <Feature
                                        title="Chiến dịch độc quyền"
                                        desc="Tham gia các chiến dịch dành cho sinh viên."
                                    />
                                    <Feature
                                        title="Sản phẩm chất lượng"
                                        desc="Mua đồng phục, phụ kiện và sản phẩm chính thức."
                                    />
                                    <Feature
                                        title="Sự kiện & tin tức"
                                        desc="Cập nhật hoạt động mới nhất của nhà trường."
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    <div>{children}</div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function Feature({ title, desc }) {
    return (
        <div className="mb-4 last:mb-0">
            <h3 className="font-bold text-blue-950 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
        </div>
    );
}
