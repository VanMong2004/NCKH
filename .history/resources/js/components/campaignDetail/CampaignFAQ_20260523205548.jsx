const faqData = [
    {
        question: 'Làm sao để tham gia?',
        answer: 'Chọn sản phẩm trong chiến dịch, nhập số lượng và nhấn đăng ký.',
    },
    {
        question: 'Có thể thay đổi đăng ký không?',
        answer: 'Việc thay đổi đăng ký phụ thuộc vào thời gian mở chiến dịch và quy định của đơn vị tổ chức.',
    },
    {
        question: 'Thanh toán như thế nào?',
        answer: 'Hệ thống sẽ hiển thị phương thức thanh toán phù hợp khi đăng ký hoặc thanh toán.',
    },
];

export default function CampaignFAQ() {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-xl font-extrabold text-blue-950 dark:text-white">Câu hỏi thường gặp</h2>

            <div className="space-y-4">
                {faqData.map((item) => (
                    <div key={item.question} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                        <h3 className="font-bold text-blue-950 dark:text-white">{item.question}</h3>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.answer}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
