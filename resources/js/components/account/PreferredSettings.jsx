export default function PreferredSettings() {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-blue-950">Preferred Settings</h2>

            <div className="mt-5 space-y-4">
                <Select label="Language" value="English" />
                <Select label="Currency" value="VND (đ)" />

                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-blue-950">Email Notifications</p>
                        <p className="text-sm text-slate-500">Receive updates about orders and offers.</p>
                    </div>

                    <button className="h-6 w-11 rounded-full bg-blue-600 p-1">
                        <span className="block h-4 w-4 translate-x-5 rounded-full bg-white" />
                    </button>
                </div>
            </div>
        </section>
    );
}

function Select({ label, value }) {
    return (
        <label className="grid gap-2 md:grid-cols-[140px_1fr] md:items-center">
            <span className="text-sm font-bold text-blue-950">{label}</span>
            <select className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none">
                <option>{value}</option>
            </select>
        </label>
    );
}
