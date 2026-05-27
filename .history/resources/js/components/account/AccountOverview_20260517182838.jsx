export default function AccountOverview({ stats }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-blue-950">Account Overview</h2>

            <div className="mt-5 space-y-4">
                {stats.map((item) => (
                    <div key={item.label}>
                        <p className="text-sm font-bold text-blue-950">{item.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.value}</p>
                    </div>
                ))}
            </div>

            <button className="mt-5 w-full rounded-lg border border-blue-950 py-3 font-bold text-blue-950">
                View My Activity
            </button>
        </section>
    );
}
