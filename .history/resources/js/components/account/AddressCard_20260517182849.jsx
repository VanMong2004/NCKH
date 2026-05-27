export default function AddressCard() {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-blue-950">Default Address</h2>

            <div className="mt-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-blue-950">ABC University - Main Campus Store</h3>
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">Default</span>
                </div>

                <p className="mt-2 text-sm text-slate-500">123 University Road, City, Country</p>

                <p className="mt-3 text-sm text-blue-950">
                    Mon - Fri: 8:00 AM - 6:00 PM
                    <br />
                    Sat: 8:00 AM - 12:00 PM
                </p>
            </div>

            <button className="mt-5 rounded-lg border border-blue-950 px-6 py-2 text-sm font-bold text-blue-950">
                Manage Addresses
            </button>
        </section>
    );
}
