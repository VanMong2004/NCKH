import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqAccordion({ faqs = [], expandedId = null, onToggle }) {
    return (
        <div className="space-y-3">
            {faqs.map((faq) => {
                const open = expandedId === faq.id;

                return (
                    <article
                        key={faq.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition dark:border-slate-800 dark:bg-slate-950"
                    >
                        <button
                            type="button"
                            onClick={() => onToggle?.(faq.id)}
                            className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                            <div className="flex min-w-0 gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                    <HelpCircle size={18} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm font-black text-blue-950 dark:text-white">{faq.question}</p>

                                    <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                        {getCategoryLabel(faq.category)}
                                    </p>
                                </div>
                            </div>

                            <ChevronDown
                                size={19}
                                className={[
                                    'mt-1 shrink-0 text-slate-400 transition',
                                    open ? 'rotate-180 text-blue-700 dark:text-blue-300' : '',
                                ].join(' ')}
                            />
                        </button>

                        {open ? (
                            <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{faq.answer}</p>
                            </div>
                        ) : null}
                    </article>
                );
            })}
        </div>
    );
}

function getCategoryLabel(category) {
    const value = String(category || '').trim();

    const map = {
        account: 'Tài khoản',
        promotion: 'Khuyến mãi',
        notification: 'Thông báo',
        order: 'Đơn hàng',
        payment: 'Thanh toán',
        pickup: 'Nhận hàng',
        review: 'Đánh giá',
    };

    return map[value] || value || 'Chung';
}
