import { ChevronDown, CreditCard, Gift, Headphones, MapPin, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PolicyNavigation({ policies = [], activeSlug = '', onChange }) {
    const [openSlug, setOpenSlug] = useState(activeSlug || policies[0]?.slug || '');

    function handleMobileToggle(policy) {
        if (openSlug === policy.slug) {
            setOpenSlug('');
            return;
        }

        setOpenSlug(policy.slug);
        onChange(policy);
    }

    return (
        <aside className="space-y-5">
            <section className="hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
                <h2 className="px-3 py-2 text-sm font-black uppercase tracking-wide text-blue-950 dark:text-white">
                    Chính sách
                </h2>

                <div className="mt-2 space-y-2">
                    {policies.map((policy) => (
                        <PolicyNavButton
                            key={policy.id || policy.slug}
                            policy={policy}
                            active={policy.slug === activeSlug}
                            onClick={() => onChange(policy)}
                        />
                    ))}
                </div>
            </section>

            <section className="space-y-3 lg:hidden">
                {policies.map((policy) => {
                    const active = policy.slug === activeSlug;
                    const open = openSlug === policy.slug;

                    return (
                        <div
                            key={policy.id || policy.slug}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <button
                                type="button"
                                onClick={() => handleMobileToggle(policy)}
                                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                            >
                                <span className="flex min-w-0 items-center gap-3">
                                    <PolicyIcon policy={policy} active={active} />

                                    <span className="line-clamp-1 text-sm font-black text-blue-950 dark:text-white">
                                        {policy.title}
                                    </span>
                                </span>

                                <ChevronDown
                                    size={18}
                                    className={[
                                        'shrink-0 text-blue-700 transition dark:text-blue-300',
                                        open ? 'rotate-180' : '',
                                    ].join(' ')}
                                />
                            </button>

                            {open ? (
                                <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
                                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        {getPolicyDescription(policy)}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => onChange(policy)}
                                        className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                                    >
                                        Xem chi tiết
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </section>

            <section className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:to-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300">
                    <Headphones size={21} />
                </div>

                <h2 className="mt-4 text-lg font-black text-blue-950 dark:text-white">Cần hỗ trợ?</h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Nếu có thắc mắc về chính sách, bạn có thể liên hệ bộ phận hỗ trợ.
                </p>

                <Link
                    to="/contact"
                    className="mt-5 flex h-11 w-full items-center justify-center rounded-xl border border-blue-300 bg-white text-sm font-black text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/30 dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-blue-500/10"
                >
                    Liên hệ hỗ trợ
                </Link>
            </section>
        </aside>
    );
}

function PolicyNavButton({ policy, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition',
                active
                    ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-500/10 dark:text-blue-300'
                    : 'text-blue-950 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800',
            ].join(' ')}
        >
            <PolicyIcon policy={policy} active={active} />

            <span className="line-clamp-1 text-sm font-black">{policy.title}</span>
        </button>
    );
}

function PolicyIcon({ policy, active }) {
    const Icon = getPolicyIcon(policy);

    return (
        <span
            className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                active
                    ? 'bg-white text-blue-700 dark:bg-slate-950 dark:text-blue-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
            ].join(' ')}
        >
            <Icon size={18} />
        </span>
    );
}

function getPolicyIcon(policy) {
    const key = `${policy.type || ''} ${policy.slug || ''} ${policy.title || ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (key.includes('pickup') || key.includes('nhan hang') || key.includes('giao hang')) {
        return MapPin;
    }

    if (key.includes('refund') || key.includes('return') || key.includes('hoan') || key.includes('doi tra')) {
        return RefreshCcw;
    }

    if (key.includes('payment') || key.includes('thanh toan')) {
        return CreditCard;
    }

    if (key.includes('privacy') || key.includes('bao mat')) {
        return ShieldCheck;
    }

    if (key.includes('campaign') || key.includes('chien dich')) {
        return Gift;
    }

    return ShieldCheck;
}

function getPolicyDescription(policy) {
    const key = `${policy.type || ''} ${policy.slug || ''} ${policy.title || ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (key.includes('pickup') || key.includes('nhan hang') || key.includes('giao hang')) {
        return 'Thông tin về địa điểm, thời gian và yêu cầu khi nhận hàng.';
    }

    if (key.includes('refund') || key.includes('return') || key.includes('hoan') || key.includes('doi tra')) {
        return 'Quy định về hoàn tiền, đổi trả và xử lý các trường hợp phát sinh.';
    }

    if (key.includes('payment') || key.includes('thanh toan')) {
        return 'Hướng dẫn phương thức thanh toán, xác nhận và xử lý giao dịch.';
    }

    if (key.includes('privacy') || key.includes('bao mat')) {
        return 'Thông tin về việc bảo vệ dữ liệu và quyền riêng tư của người dùng.';
    }

    if (key.includes('campaign') || key.includes('chien dich')) {
        return 'Điều khoản tham gia, đăng ký và nhận sản phẩm trong các chiến dịch.';
    }

    return 'Thông tin chính sách liên quan đến quá trình sử dụng hệ thống.';
}
