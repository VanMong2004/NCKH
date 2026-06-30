import { ArrowRight, CreditCard, HelpCircle, PackageCheck, ShieldCheck, Tag, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const SUPPORT_TOPICS = [
    {
        icon: PackageCheck,
        title: 'Đơn hàng',
        desc: 'Kiểm tra trạng thái, nhận hàng, hủy đơn hoặc xác nhận đơn.',
    },
    {
        icon: CreditCard,
        title: 'Thanh toán',
        desc: 'Hỗ trợ giao dịch, phương thức thanh toán và xác nhận thanh toán.',
    },
    {
        icon: Tag,
        title: 'Khuyến mãi',
        desc: 'Tư vấn chương trình ưu đãi, điều kiện áp dụng và sản phẩm khuyến mãi.',
    },
    {
        icon: UserRound,
        title: 'Tài khoản',
        desc: 'Hỗ trợ thông tin cá nhân, đăng nhập và bảo mật tài khoản.',
    },
];

export default function ContactSupport() {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        <ShieldCheck size={13} />
                        Nhóm hỗ trợ
                    </div>

                    <h2 className="mt-3 text-2xl font-black text-blue-950 dark:text-white">Chủ đề thường cần hỗ trợ</h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Chọn chủ đề phù hợp trong form để yêu cầu được xử lý nhanh hơn.
                    </p>
                </div>

                <Link
                    to="/faq"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                >
                    Xem FAQ
                    <ArrowRight size={15} />
                </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
                {SUPPORT_TOPICS.map((topic) => (
                    <SupportTopic key={topic.title} topic={topic} />
                ))}
            </div>
        </section>
    );
}

function SupportTopic({ topic }) {
    const Icon = topic.icon;

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10">
            <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                    <Icon size={20} />
                </div>

                <div>
                    <h3 className="text-base font-black text-blue-950 dark:text-white">{topic.title}</h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{topic.desc}</p>
                </div>
            </div>
        </div>
    );
}
