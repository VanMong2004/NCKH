import { SlidersHorizontal } from 'lucide-react';

export default function TransactionFilters({ active, onChange }) {
    const tabs = ['All (12)', 'E-commerce (7)', 'Campaigns (5)'];

    return (
        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                {tabs.map((tab, index) => (
                    <button
                        key={tab}
                        onClick={() => onChange(index)}
                        className={`px-5 py-3 text-sm font-bold ${
                            active === index ? 'bg-blue-950 text-white' : 'text-blue-950 hover:bg-slate-50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex gap-3">
                <select className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none md:w-52">
                    <option>All Status</option>
                    <option>Completed</option>
                    <option>Processing</option>
                    <option>Registered</option>
                    <option>Cancelled</option>
                </select>

                <button className="rounded-lg border border-slate-200 bg-white p-3 text-blue-950 md:hidden">
                    <SlidersHorizontal size={18} />
                </button>
            </div>
        </section>
    );
}
