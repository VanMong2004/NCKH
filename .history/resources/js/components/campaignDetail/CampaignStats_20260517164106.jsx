export default function CampaignStats({ campaign }) {
    const labels = ['Ngày', 'Giờ', 'Phút', 'Giây'];

    return (
        <section className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
                <h3 className="mr-4 font-bold text-blue-950">Thời gian còn lại</h3>

                {campaign.time.map((item, index) => (
                    <div key={index} className="rounded-xl bg-slate-50 px-4 py-3 text-center">
                        <p className="text-xl font-extrabold text-blue-950">{item}</p>
                        <p className="text-xs text-slate-500">{labels[index]}</p>
                    </div>
                ))}
            </div>

            <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-blue-950">
                    <span>Đã đăng ký</span>
                    <span>
                        {campaign.registered.toLocaleString('vi-VN')} / {campaign.total.toLocaleString('vi-VN')} sản
                        phẩm
                    </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${campaign.progress}%` }} />
                </div>

                <p className="mt-1 text-right text-sm font-bold text-slate-500">{campaign.progress}%</p>
            </div>
        </section>
    );
}
