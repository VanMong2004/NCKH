const faqData = [
    {
        question: 'Làm sao để tham gia?',
        answer: 'Chọn sản phẩm và nhấn đăng ký.',
    },
    {
        question: 'Có thể hủy đăng ký không?',
        answer: 'Có thể hủy trước thời gian đóng chiến dịch.',
    },
    {
        question: 'Thanh toán như thế nào?',
        answer: 'Thanh toán theo hướng dẫn của hệ thống.',
    },
];

export default function CampaignFAQ() {
    return (
        <section
            className="
rounded-2xl
border
border-slate-200
bg-white
p-6
dark:border-slate-800
dark:bg-slate-900
"
        >
            <h2
                className="
mb-5
text-xl
font-extrabold
"
            >
                Câu hỏi thường gặp
            </h2>

            <div className="space-y-4">
                {faqData.map((item, index) => (
                    <div
                        key={index}
                        className="
rounded-xl
bg-slate-50
p-4
dark:bg-slate-950
"
                    >
                        <h3
                            className="
font-bold
"
                        >
                            {item.question}
                        </h3>

                        <p
                            className="
mt-2
text-sm
text-slate-500
"
                        >
                            {item.answer}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
