import { SlidersHorizontal } from 'lucide-react';
import { campaignFilters } from '../../data/campaignData';

export default function CampaignFilters({ active, onChange }) {
    return (
        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto">
                {campaignFilters.map((item) => (
                    <button
                        key={item}
                        onClick={() => onChange(item)}
                        className={`min-w-max rounded-lg border px-4 py-2 text-sm font-bold ${
                            active === item
                                ? 'border-blue-950 bg-blue-950 text-white'
                                : 'border-slate-200 bg-white text-blue-950'
                        }`}
                    >
                        {item !== 'All' && (
                            <span
                                className={`mr-2 inline-block h-2 w-2 rounded-full ${
                                    item === 'Opening'
                                        ? 'bg-green-500'
                                        : item === 'Upcoming'
                                          ? 'bg-orange-400'
                                          : 'bg-slate-400'
                                }`}
                            />
                        )}
                        {item}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-600">Sort by:</span>

                <select className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none md:w-40">
                    <option>Newest</option>
                    <option>Popular</option>
                    <option>Ending Soon</option>
                </select>

                <button className="rounded-lg border border-slate-200 bg-white p-3 text-blue-950 md:hidden">
                    <SlidersHorizontal size={18} />
                </button>
            </div>
        </section>
    );
}
