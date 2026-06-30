import { ChevronRight } from 'lucide-react';

export default function QuickLinks() {
    const links = ['My Orders', 'My Transactions', 'Addresses', 'Payment Methods'];

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-blue-950">Quick Links</h2>

            <div className="mt-4 divide-y divide-slate-100">
                {links.map((item) => (
                    <a
                        key={item}
                        href="#"
                        className="flex items-center justify-between py-3 text-sm font-bold text-blue-950"
                    >
                        {item}
                        <ChevronRight size={18} />
                    </a>
                ))}
            </div>
        </section>
    );
}
