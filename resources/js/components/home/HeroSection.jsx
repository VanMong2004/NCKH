import Button from '../ui/Button';

export default function HeroSection() {
    return (
        <section className="overflow-hidden rounded-2xl bg-blue-50">
            <div
                className="relative min-h-[260px] bg-cover bg-center md:min-h-[360px]"
                style={{ backgroundImage: "url('/images/hero-campus.jpg')" }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100/95 via-blue-100/75 to-transparent" />

                <div className="relative z-10 max-w-xl px-6 py-10 md:px-16 md:py-16">
                    <p className="mb-3 text-xs font-bold uppercase text-blue-950">Together We Grow</p>

                    <h2 className="mb-4 text-3xl font-extrabold leading-tight text-blue-950 md:text-5xl">
                        Empowering Students, Building Tomorrow
                    </h2>

                    <p className="mb-6 max-w-md text-sm text-slate-600 md:text-base">
                        Join our campaigns, explore products, and be part of the ABC University community.
                    </p>

                    <Button>Explore Campaigns →</Button>
                </div>
            </div>
        </section>
    );
}
