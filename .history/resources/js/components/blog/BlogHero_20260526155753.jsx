export default function BlogHero() {
    return (
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
            <div className="grid items-center gap-8 p-8 lg:grid-cols-2 lg:p-12">
                <div>
                    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-700">
                        News • Events • Campaigns
                    </p>

                    <h1 className="text-4xl font-extrabold leading-tight text-blue-950 dark:text-white lg:text-5xl">
                        News, Events & Campaigns
                    </h1>

                    <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                        Stay updated with the latest news, exciting events and special campaigns from CTUT.
                    </p>
                </div>

                <div className="overflow-hidden rounded-3xl">
                    <img
                        src="https://images.unsplash.com/photo-1562774053-701939374585?w=1200"
                        alt=""
                        className="h-[250px] w-full object-cover lg:h-[320px]"
                    />
                </div>
            </div>
        </section>
    );
}
