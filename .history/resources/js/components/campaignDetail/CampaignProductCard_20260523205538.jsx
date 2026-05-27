import { Package, Star } from 'lucide-react';

export default function CampaignProductCard({ product = {} }) {
    const productInfo = product.product || {};
    const variant = product.variant || {};

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-44 items-center justify-center bg-slate-50 dark:bg-slate-950">
                <img
                    src={productInfo.thumbnail || '/images/no-image.png'}
                    alt={productInfo.name || 'Sản phẩm'}
                    className="max-h-36 object-contain"
                    onError={(e) => {
                        e.currentTarget.src = '/images/no-image.png';
                    }}
                />
            </div>

            <div className="p-4">
                <h3 className="line-clamp-2 font-bold text-blue-950 dark:text-white">
                    {productInfo.name || 'Sản phẩm chiến dịch'}
                </h3>

                <p className="mt-1 font-bold text-blue-950 dark:text-blue-300">{formatMoney(product.price)}</p>

                <div className="mt-2 flex items-center gap-2 text-xs">
                    <Star size={14} fill="currentColor" className="text-orange-400" />
                    <span className="text-orange-500">Chiến dịch</span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
                    <p>Đã đăng ký: {product.registeredQuantity || 0}</p>
                    <p>Còn lại: {product.remainingQuantity || 0}</p>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950">
                    <div className="flex items-center gap-2 text-blue-950 dark:text-white">
                        <Package size={16} />
                        <span className="font-bold">Biến thể</span>
                    </div>

                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Size: {variant.size || '—'} · Màu: {variant.color || '—'}
                    </p>

                    {variant.sku && <p className="mt-1 text-xs text-slate-400">SKU: {variant.sku}</p>}
                </div>
            </div>
        </article>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
