import { useState } from 'react';
import Breadcrumb from '../components/common/Breadcrumb';
import { CreditCard, Wallet, Truck } from 'lucide-react';
import CheckoutOrder from '../components/checkout/CheckoutOrder';
import { useCart } from '../context/CartContext';

function Checkout() {
    const { cartItems } = useCart();

    // --- STATE FORM ---
    const [email, setEmail] = useState('');
    const [subscribeNews, setSubscribeNews] = useState(true);
    const [shippingInfo, setShippingInfo] = useState({
        firstName: '',
        lastName: '',
        address: '',
        phone: '',
    });
    const [paymentMethod, setPaymentMethod] = useState('vietcombank');
    const [cardInfo, setCardInfo] = useState({
        cardNumber: '',
        expiry: '',
        cvv: '',
    });
    const [errors, setErrors] = useState({});

    // --- XỬ LÝ FORM ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setShippingInfo((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleEmailChange = (value) => {
        setEmail(value);
        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
    };

    const handleCardInfoChange = (e) => {
        const { name, value } = e.target;
        setCardInfo((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // --- VALIDATE FORM ---
    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10,11}$/;

        if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
        else if (!emailRegex.test(email)) newErrors.email = 'Email không hợp lệ';

        if (!shippingInfo.firstName.trim()) newErrors.firstName = 'Vui lòng nhập Họ';
        if (!shippingInfo.lastName.trim()) newErrors.lastName = 'Vui lòng nhập Tên';
        if (!shippingInfo.address.trim()) newErrors.address = 'Vui lòng nhập Địa chỉ';

        if (!shippingInfo.phone.trim()) newErrors.phone = 'Vui lòng nhập Số điện thoại';
        else if (!phoneRegex.test(shippingInfo.phone)) newErrors.phone = 'SĐT không hợp lệ (10-11 số)';

        if (paymentMethod === 'vietcombank') {
            if (!cardInfo.cardNumber.trim()) newErrors.cardNumber = 'Nhập số thẻ';
            if (!cardInfo.expiry.trim()) newErrors.expiry = 'Nhập ngày hết hạn';
            if (!cardInfo.cvv.trim()) newErrors.cvv = 'Nhập mã CVC';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return (
        <main className="max-w-7xl mx-auto px-4 bg-page">
            <Breadcrumb items={['Giỏ hàng', 'Thanh toán']} to={['/giohang', '/thanhtoan']} />

            <div className="sm:px-6 lg:px-8 pb-12 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 -mt-4">
                    {/* CỘT TRÁI */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* THÔNG TIN LIÊN HỆ */}
                        <div className="card p-4">
                            <h2 className="text-xl font-bold text-title mb-6">Thông tin liên hệ</h2>

                            <div className="space-y-2 mb-4">
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => handleEmailChange(e.target.value)}
                                    placeholder="nguyenvan@student.ctuet.edu.vn"
                                    className={`input-base w-full px-4 py-3 ${errors.email ? 'input-error' : ''}`}
                                />
                                {errors.email && <p className="error-text">{errors.email}</p>}
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="subscribeNews"
                                    checked={subscribeNews}
                                    onChange={(e) => setSubscribeNews(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                />
                                <label htmlFor="subscribeNews" className="text-sm text-body cursor-pointer">
                                    Gửi email cho tôi về các tin tức và ưu đãi.
                                </label>
                            </div>
                        </div>

                        {/* ĐỊA CHỈ GIAO HÀNG */}
                        <div className="card p-4">
                            <h2 className="text-xl font-bold text-title mb-6">Địa chỉ giao hàng</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <label className="label">Họ</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={shippingInfo.firstName}
                                        onChange={handleFormChange}
                                        placeholder="Nguyễn"
                                        className={`input-base w-full px-4 py-3 ${
                                            errors.firstName ? 'input-error' : ''
                                        }`}
                                    />
                                    {errors.firstName && <p className="error-text">{errors.firstName}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="label">Tên</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={shippingInfo.lastName}
                                        onChange={handleFormChange}
                                        placeholder="Văn A"
                                        className={`input-base w-full px-4 py-3 ${
                                            errors.lastName ? 'input-error' : ''
                                        }`}
                                    />
                                    {errors.lastName && <p className="error-text">{errors.lastName}</p>}
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <label className="label">Địa chỉ</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={shippingInfo.address}
                                    onChange={handleFormChange}
                                    placeholder="Số nhà, Tên đường, Phường/Xã..."
                                    className={`input-base w-full px-4 py-3 ${errors.address ? 'input-error' : ''}`}
                                />
                                {errors.address && <p className="error-text">{errors.address}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="label">Số điện thoại</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={shippingInfo.phone}
                                    onChange={handleFormChange}
                                    placeholder="091 xxx xxxx"
                                    className={`input-base w-full px-4 py-3 ${errors.phone ? 'input-error' : ''}`}
                                />
                                {errors.phone && <p className="error-text">{errors.phone}</p>}
                            </div>
                        </div>

                        {/* PHƯƠNG THỨC THANH TOÁN */}
                        <div className="card p-4">
                            <h2 className="text-xl font-bold text-title mb-6">Phương thức thanh toán</h2>

                            <div className="space-y-4">
                                {/* THẺ */}
                                <div
                                    className={`border-default rounded-lg overflow-hidden ${
                                        paymentMethod === 'vietcombank'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                            : ''
                                    }`}
                                >
                                    <div
                                        onClick={() => setPaymentMethod('vietcombank')}
                                        className="p-4 cursor-pointer flex items-center gap-4"
                                    >
                                        <input type="radio" checked={paymentMethod === 'vietcombank'} readOnly />
                                        <CreditCard className="w-5 h-5 text-body" />
                                        <span className="font-medium text-title flex-1">Thẻ tín dụng / Ghi nợ</span>
                                    </div>

                                    {paymentMethod === 'vietcombank' && (
                                        <div className="p-4 pt-0 space-y-4 border-t border-default mt-2">
                                            <input
                                                type="text"
                                                name="cardNumber"
                                                value={cardInfo.cardNumber}
                                                onChange={handleCardInfoChange}
                                                placeholder="Số thẻ (16 số)"
                                                className={`input-base w-full ${
                                                    errors.cardNumber ? 'input-error' : ''
                                                }`}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    name="expiry"
                                                    value={cardInfo.expiry}
                                                    onChange={handleCardInfoChange}
                                                    placeholder="MM/YY"
                                                    className={`input-base ${errors.expiry ? 'input-error' : ''}`}
                                                />
                                                <input
                                                    type="text"
                                                    name="cvv"
                                                    value={cardInfo.cvv}
                                                    onChange={handleCardInfoChange}
                                                    placeholder="CVC"
                                                    className={`input-base ${errors.cvv ? 'input-error' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* MOMO */}
                                <div
                                    className={`border-default rounded-lg overflow-hidden ${
                                        paymentMethod === 'momo' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''
                                    }`}
                                    onClick={() => setPaymentMethod('momo')}
                                >
                                    <div className="p-4 cursor-pointer flex items-center gap-4">
                                        <input type="radio" checked={paymentMethod === 'momo'} readOnly />
                                        <Wallet className="w-5 h-5 text-body" />
                                        <span className="font-medium text-title flex-1">Ví MoMo</span>
                                    </div>
                                </div>

                                {/* COD */}
                                <div
                                    className={`border-default rounded-lg overflow-hidden ${
                                        paymentMethod === 'cash' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''
                                    }`}
                                    onClick={() => setPaymentMethod('cash')}
                                >
                                    <div className="p-4 cursor-pointer flex items-center gap-4">
                                        <input type="radio" checked={paymentMethod === 'cash'} readOnly />
                                        <Truck className="w-5 h-5 text-body" />
                                        <span className="font-medium text-title flex-1">
                                            Thanh toán khi nhận hàng (COD)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI */}
                    <div className="lg:col-span-1">
                        <CheckoutOrder items={cartItems} onValidateForm={validateForm} />
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Checkout;
