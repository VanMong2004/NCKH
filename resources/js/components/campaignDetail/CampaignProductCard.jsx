import { Star } from 'lucide-react';

export default function CampaignProductCard({ product }) {
    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex h-44 items-center justify-center bg-slate-50">
                <img src={product.image} alt={product.name} className="max-h-36 object-contain" />
            </div>

            <div className="p-4">
                <h3 className="font-bold text-blue-950">{product.name}</h3>
                <p className="mt-1 font-bold text-blue-950">{product.priceText}</p>

                <div className="mt-2 flex items-center gap-2 text-xs">
                    <Star size={14} fill="currentColor" className="text-orange-400" />
                    <span className="text-orange-500">{product.rating}</span>
                    <span className="text-slate-500">({product.reviews})</span>
                </div>

                <p className="mt-3 text-sm text-slate-500">Đã đăng ký: {product.registered}</p>

                <select className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    {product.options.map((item) => (
                        <option key={item}>{item}</option>
                    ))}
                </select>

                <div className="mt-3 flex gap-2">
                    {product.colors.map((color) => (
                        <span key={color} className={`h-6 w-6 rounded-full border border-slate-200 ${color}`} />
                    ))}
                </div>
            </div>
        </article>
    );
}
