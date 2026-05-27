import { useState } from 'react';
import { BookOpen, ClipboardList, HelpCircle, Info, ShoppingCart } from 'lucide-react';

const tabs = [
    { key: 'info', label: 'Thông tin', icon: Info },
    { key: 'products', label: 'Sản phẩm', icon: ShoppingCart },
    { key: 'guide', label: 'Hướng dẫn', icon: BookOpen },
    { key: 'rules', label: 'Điều kiện', icon: ClipboardList },
    { key: 'faq', label: 'FAQ', icon: HelpCircle },
];

export default function CampaignTabs({ campaign = {} }) {
    const [activeTab, setActiveTab] = useState('info');

    return (
        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`flex min-w-max items-center gap-2 px-5 py-4 text-sm font-bold ${
                            activeTab === key
                                ? 'border-b-2 border-blue-950 text-blue-950 dark:border-blue-300 dark:text-blue-300'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Icon size={18} />
                        {label}
                    </button>
                ))}
            </div>

            <div className="p-5">
                {activeTab === 'info' && (
                    <>
                        <h2 className="text-xl font-bold text-blue-950 dark:text-white">Thông tin chiến dịch</h2>

                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                            {campaign.description || 'Thông tin chi tiết chiến dịch đang được cập nhật.'}
                        </p>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            <InfoBox title="Thời gian bắt đầu" value={formatDate(campaign.startDate)} />
                            <InfoBox title="Thời gian kết thúc" value={formatDate(campaign.endDate)} />
                            <InfoBox title="Hình thức nhận" value="Nhận theo hướng dẫn của nhà trường" />
                        </div>
                    </>
                )}

                {activeTab === 'products' && (
                    <TabText
                        title="Sản phẩm chiến dịch"
                        text={`Chiến dịch hiện có ${campaign.items?.length || 0} sản phẩm/biến thể đang mở đăng ký.`}
                    />
                )}

                {activeTab === 'guide' && (
                    <TabText
                        title="Hướng dẫn tham gia"
                        text="Chọn sản phẩm, chọn số lượng, chọn hình thức thanh toán và nhấn đăng ký. Thông tin đăng ký sẽ được ghi nhận trên hệ thống."
                    />
                )}

                {activeTab === 'rules' && (
                    <TabText
                        title="Điều kiện tham gia"
                        text="Người dùng cần đăng nhập và đăng ký trong thời gian chiến dịch còn hiệu lực. Số lượng đăng ký không được vượt quá số lượng còn lại."
                    />
                )}

                {activeTab === 'faq' && (
                    <TabText
                        title="Câu hỏi thường gặp"
                        text="Các câu hỏi thường gặp được hiển thị ở phần FAQ phía dưới trang."
                    />
                )}
            </div>
        </section>
    );
}

function InfoBox({ title, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm font-bold text-blue-950 dark:text-white">{title}</p>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{value || '—'}</p>
        </div>
    );
}

function TabText({ title, text }) {
    return (
        <>
            <h2 className="text-xl font-bold text-blue-950 dark:text-white">{title}</h2>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p>
        </>
    );
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
}
