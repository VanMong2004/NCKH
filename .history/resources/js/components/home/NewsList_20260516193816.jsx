import SectionHeader from '../ui/SectionHeader';

export default function NewsList({ news }) {
    return (
        <section>
            <SectionHeader title="News / Events" />

            <div className="space-y-4">
                {news.map((item) => (
                    <article key={item.id} className="flex gap-3">
                        <img src={item.image} alt={item.title} className="h-20 w-24 rounded-xl object-cover" />

                        <div>
                            <h3 className="font-bold text-blue-950">{item.title}</h3>

                            <p className="line-clamp-1 text-sm text-slate-600">{item.description}</p>

                            <p className="mt-1 text-xs text-slate-400">{item.date}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
