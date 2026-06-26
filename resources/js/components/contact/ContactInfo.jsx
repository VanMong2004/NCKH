import { Clock3, ExternalLink, Globe2, Mail, MapPin, Phone } from 'lucide-react';

const FALLBACK_INFO = {
    schoolName: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
    address: '256 Nguyễn Văn Cừ, Phường Cái Khế, Thành phố Cần Thơ',
    email: 'phonghanhchinh@ctuet.edu.vn',
    phone: '02923 894 050',
    website: 'https://ctuet.edu.vn/',
    mapUrl: 'https://maps.app.goo.gl/uArkPsittm4Eu4NS6',
};

export default function ContactInfo({ info }) {
    const data = {
        ...FALLBACK_INFO,
        ...(info || {}),
    };

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-blue-950 dark:text-white">Thông tin liên hệ</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Các kênh liên hệ chính thức của hệ thống.
            </p>

            <div className="mt-5 space-y-4">
                <InfoItem icon={MapPin} label="Địa chỉ" value={data.address} />

                <InfoItem icon={Mail} label="Email" value={data.email} href={`mailto:${data.email}`} />

                <InfoItem icon={Phone} label="Điện thoại" value={data.phone} href={`tel:${data.phone}`} />

                <InfoItem icon={Globe2} label="Website" value={data.website} href={data.website} />

                <InfoItem icon={Clock3} label="Thời gian hỗ trợ" value="Thứ Hai - Thứ Sáu, 8:00 - 17:00" />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex min-h-[180px] items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-100 p-6 text-center dark:from-blue-500/10 dark:via-slate-950 dark:to-slate-900">
                    <div>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                            <MapPin size={26} />
                        </div>

                        <p className="mt-4 text-sm font-black text-blue-950 dark:text-white">Vị trí trường</p>

                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            Mở bản đồ để xem đường đi chi tiết.
                        </p>
                    </div>
                </div>

                <a
                    href={data.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-12 items-center justify-center gap-2 border-t border-slate-200 text-sm font-black text-blue-700 transition hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-blue-500/10"
                >
                    Mở Google Maps
                    <ExternalLink size={16} />
                </a>
            </div>
        </section>
    );
}

function InfoItem({ icon: Icon, label, value, href }) {
    const content = (
        <>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon size={20} />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>

                <p className="mt-1 break-words text-sm font-bold leading-6 text-blue-950 dark:text-white">
                    {value || 'Đang cập nhật'}
                </p>
            </div>
        </>
    );

    if (href) {
        return (
            <a
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10"
            >
                {content}
            </a>
        );
    }

    return <div className="flex gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">{content}</div>;
}
