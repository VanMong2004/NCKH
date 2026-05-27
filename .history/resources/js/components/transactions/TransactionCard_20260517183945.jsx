import { Check, ChevronRight, Package, ShoppingBag, Megaphone } from 'lucide-react';

export default function TransactionCard({ item }) {
    const isCampaign = item.type === 'Campaigns';

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
            <div className="grid gap-5 md:grid-cols-[220px_1fr_320px_160px] md:items-center">
                <div className="flex gap-4">
                    <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-950 md:flex">
                        {isCampaign ? <Megaphone size={28} /> : <ShoppingBag size={28} />}
                    </div>

                    <div>
                        <StatusBadge status={item.status} />

                        <h3 className="mt-3 font-extrabold text-blue-950">{item.code}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.date}</p>

                        <span className="mt-3 inline-block rounded-md bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {item.type}
                        </span>
                    </div>
                </div>

                <div className="flex gap-4 border-y border-slate-100 py-4 md:border-y-0 md:border-l md:border-r md:px-5 md:py-0">
                    <div className="flex gap-2">
                        {item.images.map((image) => (
                            <img
                                key={image}
                                src={image}
                                alt=""
                                className="h-20 w-20 rounded-xl bg-slate-50 object-contain"
                            />
                        ))}
                    </div>

                    <div>
                        <h4 className="font-bold text-blue-950">{item.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>

                        {item.total && (
                            <p className="mt-2 text-sm">
                                <span className="text-slate-500">Total: </span>
                                <span className="font-bold text-blue-950">{item.total}</span>
                            </p>
                        )}
                    </div>
                </div>

                <Timeline item={item} />

                <div className="hidden space-y-3 md:block">
                    <button className="w-full rounded-lg border border-blue-950 py-3 text-sm font-bold text-blue-950">
                        View Details
                    </button>

                    {item.status === 'Completed' && (
                        <button className="w-full rounded-lg border border-blue-950 py-3 text-sm font-bold text-blue-950">
                            QR Pickup
                        </button>
                    )}

                    {item.status === 'Registered' && (
                        <button className="w-full rounded-lg bg-blue-950 py-3 text-sm font-bold text-white">
                            Pay Now
                        </button>
                    )}

                    {item.status === 'Processing' && (
                        <button className="w-full rounded-lg border border-blue-950 py-3 text-sm font-bold text-blue-950">
                            Cancel Order
                        </button>
                    )}
                </div>

                <button className="absolute right-5 top-5 md:hidden">
                    <ChevronRight size={20} />
                </button>
            </div>

            {item.note && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 md:flex md:items-center md:justify-between">
                    <span>{item.note}</span>
                    <button className="mt-3 rounded-lg bg-blue-950 px-5 py-2 font-bold text-white md:mt-0">
                        Pay Now
                    </button>
                </div>
            )}
        </article>
    );
}

function StatusBadge({ status }) {
    const colors = {
        Completed: 'bg-green-100 text-green-700',
        Registered: 'bg-blue-100 text-blue-700',
        Processing: 'bg-orange-100 text-orange-700',
        Cancelled: 'bg-slate-100 text-slate-500',
    };

    return <span className={`rounded-md px-3 py-1 text-xs font-bold ${colors[status]}`}>{status}</span>;
}

function Timeline({ item }) {
    return (
        <div>
            <div className="grid grid-cols-4 gap-2 md:block md:space-y-3">
                {item.steps.map((step, index) => {
                    const done = index + 1 <= item.activeStep;

                    return (
                        <div key={step} className="flex flex-col items-center gap-2 md:flex-row">
                            <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                                    done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                                }`}
                            >
                                {done ? <Check size={13} /> : index + 1}
                            </div>

                            <p className="text-center text-[11px] font-bold text-blue-950 md:text-left md:text-sm">
                                {step}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
