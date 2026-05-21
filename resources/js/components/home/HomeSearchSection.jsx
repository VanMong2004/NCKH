import SearchBar from '../ui/SearchBar';

export default function HomeSearchSection() {
    const suggestions = ['Áo đồng phục', 'Bảng tên sinh viên', 'Sự kiện hè 2024', 'Balo', 'Mũ lưỡi trai'];

    const keywords = ['#BackToSchool', '#Uniform2024', '#SummerEvent', '#NewArrival', '#StudentLife'];

    return (
        <section className="mt-5 grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
            <div>
                <div className="mb-3 flex items-center gap-2">
                    <h2 className="font-bold text-blue-950">Find What You Need</h2>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">Realtime Search</span>
                </div>

                <SearchBar placeholder="Search for products, campaigns, events..." />

                <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map((item) => (
                        <span
                            key={item}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                        >
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            <div>   
                <h2 className="mb-3 font-bold text-blue-950">🔥 Trending Keywords</h2>

                <div className="flex flex-wrap gap-2">
                    {keywords.map((item) => (
                        <span
                            key={item}
                            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
                        >
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
