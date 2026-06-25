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
    siteContent = null,
}) {
    const authBanner = siteContent?.auth_banner || {};
    const payload = authBanner.payload || {};

    const bannerTitle = authBanner.title || title;
    const bannerDescription = authBanner.description || description;
    const bannerImage = authBanner.image || '/images/bg-sign.png';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <AuthHeader
                question={question}
                linkText={linkText}
                linkHref={linkHref}
                siteContent={siteContent}
            />

            <main className="bg-blue-50 dark:bg-slate-950">
                <div className="mx-auto grid min-h-[720px] max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1fr_560px] md:items-center">
                    <section
                        className="relative hidden min-h-[620px] overflow-hidden rounded-2xl md:block"
                        style={{
                            backgroundImage: `url('${bannerImage}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-blue-50/90 dark:from-slate-950/80 dark:via-slate-900/60 dark:to-slate-950/80" />

                        <div className="relative z-10 p-12">
                            <h2 className="max-w-md text-4xl font-extrabold leading-tight text-blue-950 dark:text-white">
                                {bannerTitle}
                            </h2>

                            <p className="mt-5 max-w-md text-lg text-slate-600 dark:text-slate-300">
                                {bannerDescription}
                            </p>

                            <div className="mt-6 h-1 w-16 rounded-full bg-blue-950 dark:bg-blue-400" />

                            {showInfoCard && (
                                <div className="mt-72 max-w-xs rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur dark:bg-slate-900/90">
                                    <Feature
                                        title={payload.feature_1_title || 'Khuyến mãi hấp dẫn'}
                                        desc={payload.feature_1_desc || 'Nhận các chương trình khuyến mãi và ưu đãi dành riêng cho cộng đồng CTUT.'}
                                    />
                                    <Feature
                                        title={payload.feature_2_title || 'Sản phẩm chất lượng'}
                                        desc={payload.feature_2_desc || 'Đồng phục, phụ kiện và quà lưu niệm chính hãng.'}
                                    />
                                    <Feature
                                        title={payload.feature_3_title || 'Tin tức mới nhất'}
                                        desc={payload.feature_3_desc || 'Cập nhật hoạt động, thông báo và sự kiện mới nhất từ nhà trường.'}
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    <div>{children}</div>
                </div>
            </main>

            <Footer footer={siteContent?.footer} />
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