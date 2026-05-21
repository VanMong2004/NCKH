import { Check, Copy, Info } from 'lucide-react';

export default function CampaignSuccessHero({ data }) {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-green-100 bg-green-50 px-4 py-10 text-center">
            <Confetti />

            <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg">
                <Check size={38} />
            </div>

            <h1 className="relative z-10 mt-6 text-3xl font-extrabold text-green-700 md:text-4xl">
                Đăng ký tham gia thành công!
            </h1>

            <p className="relative z-10 mx-auto mt-3 max-w-xl text-blue-950">
                Cảm ơn bạn đã đăng ký chiến dịch “Đồng phục ABC 2024”. Chúng tôi đã nhận được thông tin của bạn.
            </p>

            <div className="relative z-10 mx-auto mt-8 grid max-w-4xl gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
                <div className="flex flex-col items-center justify-center">
                    <p className="font-bold uppercase text-blue-950">Mã đăng ký của bạn</p>

                    <div className="mt-5 flex items-center gap-3 rounded-lg border border-dashed border-blue-200 px-8 py-4">
                        <span className="text-2xl font-extrabold text-green-600 md:text-3xl">{data.code}</span>

                        <button className="text-blue-700">
                            <Copy size={20} />
                        </button>
                    </div>

                    <p className="mt-7 font-bold text-blue-950">Ngày đăng ký</p>
                    <p className="mt-2 font-semibold text-blue-950">{data.date}</p>
                </div>

                <div className="flex flex-col items-center border-t border-slate-200 pt-6 md:border-l md:border-t-0 md:pt-0">
                    <p className="font-bold uppercase text-blue-950">Quét mã QR để xem thông tin</p>

                    <img src={data.qrImage} alt="QR Code" className="mt-4 h-40 w-40 object-contain" />

                    <p className="mt-3 text-sm text-slate-600">Lưu hoặc chia sẻ mã QR này</p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 md:col-span-2">
                    <div className="flex justify-center gap-2">
                        <Info size={18} />
                        <p>
                            Thông tin chi tiết đã được gửi đến email: <strong>{data.email}</strong>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Confetti() {
    const items = [
        'left-[7%] top-[18%] bg-blue-600',
        'left-[15%] top-[28%] bg-green-500',
        'left-[25%] top-[20%] bg-yellow-500',
        'right-[15%] top-[18%] bg-orange-500',
        'right-[7%] top-[30%] bg-green-500',
        'left-[35%] top-[12%] bg-blue-600',
        'right-[28%] top-[34%] bg-purple-500',
    ];

    return (
        <>
            {items.map((item, index) => (
                <span key={index} className={`absolute h-2 w-2 rotate-45 rounded-sm ${item}`} />
            ))}
        </>
    );
}
