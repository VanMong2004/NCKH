import { ArrowRight, Headphones, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FaqHelpCard() {
    return (
        <section className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:to-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300">
                <Headphones size={23} />
            </div>

            <h2 className="mt-4 text-lg font-black text-blue-950 dark:text-white">Cần hỗ trợ thêm?</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Nếu FAQ chưa giải đáp được vấn đề của bạn, hãy gửi yêu cầu hỗ trợ để được phản hồi.
            </p>

            <div className="mt-5 space-y-3">
                <HelpItem icon={MessageCircle} title="Tư vấn nhanh" desc="Gửi câu hỏi về đơn hàng hoặc chiến dịch." />

                <HelpItem icon={Mail} title="Liên hệ qua form" desc="Điền thông tin để bộ phận hỗ trợ phản hồi." />

                <HelpItem
                    icon={ShieldCheck}
                    title="Thông tin bảo mật"
                    desc="Dữ liệu hỗ trợ được xử lý theo chính sách hệ thống."
                />
            </div>

            <Link
                to="/contact"
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
                Liên hệ hỗ trợ
                <ArrowRight size={16} />
            </Link>
        </section>
    );
}

function HelpItem({ icon: Icon, title, desc }) {
    return (
        <div className="flex gap-3 rounded-2xl bg-white/80 p-3 dark:bg-slate-950/70">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon size={18} />
            </div>

            <div>
                <p className="text-sm font-black text-blue-950 dark:text-white">{title}</p>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
        </div>
    );
}
