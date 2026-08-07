import {
    Building2,
    CalendarClock,
    CheckCircle2,
    FileText,
    Info,
    Loader2,
    MapPin,
    QrCode,
    RefreshCcw,
} from 'lucide-react';

export default function PolicyContent({ policy, loading, onRetry }) {
    if (loading) {
        return (
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <Loader2 size={26} className="animate-spin" />
                </div>

                <p className="mt-4 text-sm font-black text-blue-950 dark:text-white">Đang tải nội dung chính sách...</p>
            </section>
        );
    }

    if (!policy) {
        return (
            <section className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-xl font-black text-blue-950 dark:text-white">Chưa chọn chính sách</h2>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Vui lòng chọn một chính sách để xem nội dung chi tiết.
                </p>
            </section>
        );
    }

    return (
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 border-b border-slate-200 pb-7 dark:border-slate-800 md:flex-row md:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <FileText size={26} />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">
                        Chính sách
                    </p>

                    <h1 className="mt-2 text-3xl font-black leading-tight text-blue-950 dark:text-white md:text-4xl">
                        {policy.title}
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Vui lòng đọc kỹ nội dung chính sách để nắm rõ quyền lợi, trách nhiệm và các lưu ý khi sử dụng hệ
                        thống.
                    </p>
                </div>
            </div>

            <div className="mt-8">
                {policy.content ? (
                    <div
                        className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-blue-950 prose-a:font-bold prose-a:text-blue-700 prose-img:rounded-2xl prose-img:shadow-sm dark:prose-invert dark:prose-headings:text-white dark:prose-a:text-blue-300"
                        dangerouslySetInnerHTML={{
                            __html: policy.content,
                        }}
                    />
                ) : (
                    <FallbackPolicyContent policy={policy} />
                )}
            </div>

            <ImportantNotes />
        </article>
    );
}

function FallbackPolicyContent({ policy }) {
    const sections = getFallbackSections(policy);

    return (
        <div className="space-y-7">
            {sections.map((section, index) => {
                const Icon = section.icon;

                return (
                    <section
                        key={section.title}
                        className="grid gap-4 border-b border-slate-200 pb-7 last:border-b-0 dark:border-slate-800 md:grid-cols-[54px_minmax(0,1fr)]"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            <Icon size={24} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-blue-950 dark:text-white">
                                {index + 1}. {section.title}
                            </h2>

                            <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {section.items.map((item) => (
                                    <p key={item}>{item}</p>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function ImportantNotes() {
    return (
        <section className="mt-9 rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 dark:bg-slate-950 dark:text-blue-300">
                    <Info size={20} />
                </div>

                <div>
                    <h2 className="text-base font-black text-blue-950 dark:text-white">Lưu ý quan trọng</h2>

                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        <li>Người dùng nên đọc kỹ chính sách trước khi thực hiện giao dịch hoặc sử dụng khuyến mãi.</li>
                        <li>Một số chính sách có thể được cập nhật theo từng thời điểm.</li>
                        <li>Nếu cần hỗ trợ, vui lòng liên hệ bộ phận chăm sóc khách hàng.</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}

function getFallbackSections(policy) {
    const key = `${policy.type || ''} ${policy.slug || ''} ${policy.title || ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (key.includes('pickup') || key.includes('nhan hang') || key.includes('giao hang')) {
        return [
            {
                title: 'Địa điểm nhận hàng',
                icon: Building2,
                items: [
                    'Sản phẩm sẽ được nhận tại địa điểm do nhà trường hoặc đơn vị tổ chức thông báo.',
                    'Người nhận cần kiểm tra kỹ thông tin đơn hàng trước khi đến nhận.',
                ],
            },
            {
                title: 'Thời gian nhận hàng',
                icon: CalendarClock,
                items: [
                    'Thời gian nhận hàng được thông báo trên hệ thống hoặc trong chi tiết đơn hàng.',
                    'Các trường hợp nhận trễ có thể được điều chỉnh theo lịch hỗ trợ của bộ phận phụ trách.',
                ],
            },
            {
                title: 'Yêu cầu xác nhận',
                icon: CheckCircle2,
                items: [
                    'Người nhận cần cung cấp thông tin xác nhận như mã đơn hàng, mã sinh viên hoặc email đặt hàng.',
                    'Đơn hàng chỉ được bàn giao cho người có thông tin trùng khớp với dữ liệu hệ thống.',
                ],
            },
            {
                title: 'Xác nhận khi nhận hàng',
                icon: QrCode,
                items: [
                    'Vui lòng xuất trình mã đơn hàng khi nhận sản phẩm.',
                    'Nhân viên sẽ đối chiếu mã đơn hàng để xác minh và hoàn tất quy trình nhận hàng.',
                ],
            },
        ];
    }

    if (key.includes('refund') || key.includes('return') || key.includes('hoan') || key.includes('doi tra')) {
        return [
            {
                title: 'Điều kiện hoàn trả',
                icon: RefreshCcw,
                items: [
                    'Sản phẩm cần còn nguyên trạng theo quy định của chương trình.',
                    'Yêu cầu hoàn trả cần được gửi trong thời hạn được công bố.',
                ],
            },
            {
                title: 'Quy trình xử lý',
                icon: CheckCircle2,
                items: [
                    'Bộ phận hỗ trợ sẽ kiểm tra thông tin đơn hàng và tình trạng sản phẩm.',
                    'Kết quả xử lý sẽ được thông báo qua hệ thống hoặc email.',
                ],
            },
        ];
    }

    return [
        {
            title: 'Phạm vi áp dụng',
            icon: FileText,
            items: [
                'Chính sách này áp dụng cho các hoạt động sử dụng hệ thống, đặt hàng và sử dụng khuyến mãi.',
                'Người dùng cần tuân thủ các quy định được công bố trên hệ thống.',
            ],
        },
        {
            title: 'Trách nhiệm người dùng',
            icon: CheckCircle2,
            items: [
                'Cung cấp thông tin chính xác khi đăng ký, đặt hàng hoặc gửi yêu cầu hỗ trợ.',
                'Theo dõi thông báo từ hệ thống để cập nhật thay đổi liên quan.',
            ],
        },
        {
            title: 'Hỗ trợ',
            icon: MapPin,
            items: [
                'Mọi thắc mắc có thể được gửi đến bộ phận hỗ trợ qua trang liên hệ.',
                'Thời gian phản hồi phụ thuộc vào nội dung và mức độ phức tạp của yêu cầu.',
            ],
        },
    ];
}