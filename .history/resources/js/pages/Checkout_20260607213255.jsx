import { ChevronRight, Home } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import MainLayout from '../layout/MainLayout';

import CheckoutSteps from '../components/checkout/CheckoutSteps';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import PaymentMethod from '../components/checkout/PaymentMethod';
import ReceiverForm from '../components/checkout/ReceiverForm';

import { useCart } from '../contexts/CartContext';

import orderService from '../services/orderService';
import paymentService from '../services/paymentService';

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();

    const cartItemIds = location.state?.cartItemIds || [];

    const { cartItems, totalItems, grandTotal, fetchCart } = useCart();

    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null);

    const checkoutItems = cartItems.filter((item) => cartItemIds.includes(item.cartItemId));

    const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const checkoutTotalItems = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);

    function validate() {
        const nextErrors = {};

       if (!pendingPaymentOrder && checkoutItems.length === 0) {
            nextErrors.cart = 'Giỏ hàng đang trống';
        }

        if (!pendingPaymentOrder && !selectedAddressId) {
            nextErrors.address = 'Vui lòng chọn địa chỉ nhận hàng';
        }

        if (!paymentMethod) {
            nextErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    async function handleCheckout() {
        if (loading) return;

        if (!validate()) {
            if (errors.cart) {
                toast.warning(errors.cart);
            }

            return;
        }

        try {
            setLoading(true);

            if (pendingPaymentOrder) {
                await payExistingOrder(pendingPaymentOrder);
                return;
            }

            const order = await orderService.checkout({
                address_id: selectedAddressId,
                payment_method: paymentMethod,
                cart_item_ids: cartItemIds,
            });

            if (!order.id) {
                toast.error('Không lấy được mã đơn hàng');
                return;
            }

            const method = order.paymentMethod;

            /**
             * COD:
             * Chỉ checkout, không gọi /pay.
             */
            if (method === 'cod') {
                await fetchCart();

                toast.success('Đặt hàng thành công');

                navigate(`/order-success/${order.id}`, {
                    replace: true,
                    state: {
                        orderCode: order.orderCode,
                        paymentMethod: method,
                    },
                });

                return;
            }

            /**
             * Online payment:
             * mock/vnpay phải gọi /pay.
             */
            setPendingPaymentOrder(order);

            await payExistingOrder(order);
        } catch (error) {
            console.error('Checkout error:', error);

            toast.error(error?.message || error?.response?.data?.message || 'Không thể đặt hàng');
        } finally {
            setLoading(false);
        }
    }

    async function payExistingOrder(order) {
        try {
            const payment = await paymentService.pay(order.id, order.paymentMethod);

            setPendingPaymentOrder(null);

            await fetchCart();

            if (payment.redirectUrl) {
                window.location.href = payment.redirectUrl;
                return;
            }

            toast.success('Đặt hàng và tạo thanh toán thành công');

            navigate(`/order-success/${order.id}`, {
                replace: true,
                state: {
                    orderCode: order.orderCode,
                    paymentMethod: order.paymentMethod,
                },
            });
        } catch (paymentError) {
            console.error('Payment error:', paymentError);

            setPendingPaymentOrder(order);

            toast.error(
                paymentError?.message ||
                    paymentError?.response?.data?.message ||
                    'Không thể tạo thanh toán cho đơn hàng này',
            );
        }
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Breadcrumb />

                <CheckoutSteps />

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
                    <div className="space-y-6">
                        <ReceiverForm
                            selectedAddressId={selectedAddressId}
                            onSelectAddress={(id) => {
                                setSelectedAddressId(id);

                                setErrors((prev) => ({
                                    ...prev,
                                    address: '',
                                }));
                            }}
                            error={errors.address}
                        />

                        <PaymentMethod
                            value={paymentMethod}
                            error={errors.paymentMethod}
                            disabled={Boolean(pendingPaymentOrder)}
                            onChange={(method) => {
                                if (pendingPaymentOrder) return;

                                setPaymentMethod(method);

                                setErrors((prev) => ({
                                    ...prev,
                                    paymentMethod: '',
                                }));
                            }}
                        />
                    </div>

                    <CheckoutSummary
                        items={checkoutItems}
                        subtotal={subtotal}
                        totalItems={checkoutTotalItems}
                        onCheckout={handleCheckout}
                        loading={loading}
                        buttonText={pendingPaymentOrder ? 'Thanh toán lại' : 'Đặt hàng'}
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
