import { Banknote, CreditCard, MapPinned, Truck } from 'lucide-react';

const fulfillmentMethods = [
    {
        value: 'delivery',
        title: 'Giao hàng tận nơi',
        desc: 'Nhân viên sẽ giao sản phẩm đến địa chỉ bạn cung cấp.',
        icon: Truck,
    },
    {
        value: 'pickup',
        title: 'Nhận tại Phòng Công tác Chính trị và Quản lý sinh viên',
        desc: 'Bạn đến nhận hàng trực tiếp tại phòng và có thể thanh toán tại chỗ.',
        icon: MapPinned,
    },
];

const paymentMethodsByFulfillment = {
    delivery: [
        {
            value: 'cod',
            title: 'Thanh toán khi nhận hàng',
            desc: 'Thanh toán trực tiếp cho người giao hàng khi nhận sản phẩm.',
            icon: Banknote,
        },
        {
            value: 'mock_bank',
            title: 'Giả lập ngân hàng',
            desc: 'Dùng để mô phỏng luồng thanh toán chuyển khoản trực tuyến.',
            icon: CreditCard,
        },
    ],
    pickup: [
        {
            value: 'cash_on_pickup',
            title: 'Thanh toán trực tiếp khi nhận tại phòng',
            desc: 'Thanh toán bằng tiền mặt khi đến nhận hàng tại phòng.',
            icon: Banknote,
        },
        {
            value: 'mock_bank',
            title: 'Giả lập ngân hàng',
            desc: 'Dùng để mô phỏng luồng thanh toán chuyển khoản trực tuyến.',
            icon: CreditCard,
        },
    ],
};

export default function PaymentMethod({
    fulfillmentMethod,
    paymentMethod,
    onFulfillmentChange,
    onPaymentChange,
    errors = {},
    disabled = false,
}) {
    const paymentMethods = paymentMethodsByFulfillment[fulfillmentMethod] || [];

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-6">
                <div>
                    <h2 className="mb-3 text-lg font-bold text-blue-950 dark:text-white">
                        Phương thức nhận hàng
                    </h2>

                    <div className="grid gap-3">
                        {fulfillmentMethods.map((method) => (
                            <OptionCard
                                key={method.value}
                                method={method}
                                active={fulfillmentMethod === method.value}
                                disabled={disabled}
                                onClick={() => onFulfillmentChange?.(method.value)}
                            />
                        ))}
                    </div>

                    {errors.fulfillment_method && (
                        <p className="mt-2 text-sm font-semibold text-red-500">
                            {errors.fulfillment_method}
                        </p>
                    )}
                </div>

                <div>
                    <h2 className="mb-3 text-lg font-bold text-blue-950 dark:text-white">
                        Phương thức thanh toán
                    </h2>

                    <div className="grid gap-3">
                        {paymentMethods.map((method) => (
                            <OptionCard
                                key={method.value}
                                method={method}
                                active={paymentMethod === method.value}
                                disabled={disabled}
                                onClick={() => onPaymentChange?.(method.value)}
                            />
                        ))}
                    </div>

                    {errors.payment_method && (
                        <p className="mt-2 text-sm font-semibold text-red-500">
                            {errors.payment_method}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

function OptionCard({ method, active, disabled, onClick }) {
    const Icon = method.icon;

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => {
                if (disabled) return;
                onClick?.();
            }}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                active
                    ? 'border-blue-950 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
                    : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950'
            }`}
        >
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    active
                        ? 'bg-blue-950 text-white dark:bg-blue-600'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                }`}
            >
                <Icon size={21} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="mt-2 font-semibold text-blue-950 dark:text-white">{method.title}</p>
                {/* <p className="font-bold text-blue-950 dark:text-white">{method.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{method.desc}</p> */}
            </div>
        </button>
    );
}
