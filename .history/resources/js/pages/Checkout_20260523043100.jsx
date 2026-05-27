import { ChevronRight, Home } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import CheckoutSteps from '../components/checkout/CheckoutSteps';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import PaymentMethod from '../components/checkout/PaymentMethod';
import ReceiverForm from '../components/checkout/ReceiverForm';
import MainLayout from '../layout/MainLayout';

import { useCart } from '../contexts/CartContext';

import addressService from '../services/addressService';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';

export default function Checkout() {
    const navigate = useNavigate();

    const { cartItems, totalPrice, totalItems, fetchCart } = useCart();

    const [selectedAddressId, setSelectedAddressId] = useState('');

    const [receiver, setReceiver] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        note: '',
    });

    const [addresses, setAddresses] = useState([]);
    const [loadingAddress, setLoadingAddress] = useState(true);

    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false);

    const subtotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    }, [cartItems]);

    useEffect(() => {
        loadAddresses();
    }, []);

    useEffect(() => {
        if (cartItems.length === 0 && !loading && !orderCreated) {
            toast.info('Giỏ hàng đang trống');
            navigate('/cart', { replace: true });
        }
    }, [cartItems.length, loading, orderCreated, navigate]);

    async function loadAddresses() {
        try {
            setLoadingAddress(true);

            const list = await addressService.getAddresses();

            setAddresses(list);

            const defaultAddress = list.find((item) => item.isDefault) || list[0];

            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
                fillAddress(defaultAddress);
            }
        } catch {
            toast.error('Không tải được địa chỉ');
        } finally {
            setLoadingAddress(false);
        }
    }

    function fillAddress(address) {
        setReceiver({
            name: address.fullName || '',
            phone: address.phone || '',
            email: address.email || '',
            address: address.addressLine || address.fullAddress || '',
            note: '',
        });
    }

    function handleReceiverChange(field, value) {
        setReceiver((prev) => ({
            ...prev,
            [field]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: '',
        }));
    }

    function handleSelectAddress(id) {
        setSelectedAddressId(id);

        if (!id) {
            setReceiver((prev) => ({
                ...prev,
                name: '',
                phone: '',
                email: '',
                address: '',
            }));
            return;
        }

        const selected = addresses.find((item) => String(item.id) === String(id));

        if (selected) {
            fillAddress(selected);
        }
    }

    function validate() {
        const nextErrors = {};

        if (!selectedAddressId) {
            nextErrors.address = 'Vui lòng chọn địa chỉ đã lưu';
        }

        if (!paymentMethod) {
            nextErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }
    async function handleCheckout() {
        if (loading || orderCreated) return;

        if (!validate()) return;

        try {
            setLoading(true);

            const addressId = await createAddressIfNeeded();

            if (!addressId) {
                toast.error('Không tạo được địa chỉ nhận hàng');
                return;
            }

            const order = await orderService.checkout({
                address_id: addressId,
                payment_method: paymentMethod,
                note: receiver.note,
            });

            if (!order.id) {
                toast.error('Không lấy được mã đơn hàng');
                return;
            }

            setOrderCreated(true);

            if (paymentMethod === 'cod') {
                await fetchCart();
                toast.success('Đặt hàng thành công');
                navigate(`/order-success/${order.id}`, { replace: true });
                return;
            }

            const payment = await paymentService.pay(order.id, paymentMethod);

            await fetchCart();

            if (payment.paymentUrl) {
                window.location.href = payment.paymentUrl;
                return;
            }

            toast.success('Đặt hàng thành công');
            navigate(`/order-success/${order.id}`, { replace: true });
        } catch (error) {
            setOrderCreated(false);
            setErrors(error.errors || {});
            toast.error(error.message || 'Không thể đặt hàng');
        } finally {
            setLoading(false);
        }
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-5 sm:py-6">
                <Breadcrumb />

                <CheckoutSteps activeStep={2} />

                <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="space-y-6">
                        <ReceiverForm
                            receiver={receiver}
                            errors={errors}
                            addresses={addresses}
                            selectedAddressId={selectedAddressId}
                            loadingAddress={loadingAddress}
                            onChange={handleReceiverChange}
                            onSelectAddress={handleSelectAddress}
                        />

                        <PaymentMethod
                            value={paymentMethod}
                            error={errors.paymentMethod}
                            onChange={(value) => {
                                setPaymentMethod(value);
                                setErrors((prev) => ({
                                    ...prev,
                                    paymentMethod: '',
                                }));
                            }}
                        />
                    </div>

                    <CheckoutSummary
                        items={cartItems}
                        subtotal={subtotal || totalPrice}
                        totalItems={totalItems}
                        loading={loading || orderCreated}
                        onCheckout={handleCheckout}
                    />
                </section>
            </main>
        </MainLayout>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>

            <ChevronRight size={14} />

            <Link to="/cart" className="hover:text-blue-950 dark:hover:text-blue-300">
                Giỏ hàng
            </Link>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Thanh toán</span>
        </div>
    );
}
