export default function OrderDetailItems({ order }) {
    const items = order.items || [];

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-bold text-blue-950 dark:text-white">Sản phẩm trong đơn hàng</h2>

            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                    >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                            <img
                                src={item.thumbnail || '/images/no-image.png'}
                                alt={item.productName}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                    e.currentTarget.src = '/images/no-image.png';
                                }}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 font-bold text-blue-950 dark:text-white">{item.productName}</p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {item.variant?.size && <>Size: {item.variant.size}</>}
                                {item.variant?.size && item.variant?.color && ' · '}
                                {item.variant?.color && <>Màu: {item.variant.color}</>}
                            </p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                SL: {item.quantity} · {formatMoney(item.price)}
                            </p>
                        </div>

                        <p className="text-sm font-bold text-blue-950 dark:text-blue-300">{formatMoney(item.total)}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
