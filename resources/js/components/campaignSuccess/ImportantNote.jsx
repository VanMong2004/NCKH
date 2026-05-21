import { AlertTriangle } from 'lucide-react';

export default function ImportantNote() {
    return (
        <section className="mt-8 overflow-hidden rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <div className="grid gap-5 md:grid-cols-[1fr_260px] md:items-center">
                <div>
                    <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-yellow-600" />
                        <h2 className="font-extrabold uppercase text-blue-950">Lưu ý quan trọng</h2>
                    </div>

                    <ul className="list-disc space-y-2 pl-6 text-sm text-blue-950">
                        <li>Mã đăng ký này dùng để tra cứu thông tin và nhận hàng, vui lòng lưu lại.</li>
                        <li>Không chia sẻ mã đăng ký với người khác để đảm bảo thông tin của bạn được bảo mật.</li>
                        <li>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ Ban tổ chức.</li>
                    </ul>
                </div>

                <img
                    src="/images/campaign-success-products.png"
                    alt="Campaign products"
                    className="mx-auto max-h-36 object-contain"
                />
            </div>
        </section>
    );
}
