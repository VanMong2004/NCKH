import { ChevronDown } from 'lucide-react';

export default function CampaignFAQ({ items }) {
    return (
        <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-blue-950">Câu hỏi thường gặp</h2>
                <a href="#" className="text-sm font-bold text-blue-700">
                    Xem tất cả
                </a>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {items.map((item, index) => (
                    <button
                        key={item}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-blue-950"
                    >
                        <span>
                            {index + 1}. {item}
                        </span>
                        <ChevronDown size={16} />
                    </button>
                ))}
            </div>
        </section>
    );
}
