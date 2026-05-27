import { ChevronRight, Home } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

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

    const { cartItems, totalItems, grandTotal, fetchCart } = useCart();

    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false);

    const subtotal = grandTotal;

    function validate() {
        const nextErrors = {};

        if (cartItems.length === 0) {
            nextErrors.cart = 'Giỏ hàng đang trống';
        }

        if (!selectedAddressId) {
            nextErrors.address = 'Vui lòng chọn địa chỉ nhận hàng';
        }

        if (!paymentMethod) {
            nextErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    async function handleCheckout() {
        if (loading || orderCreated) return;

        if (!validate()) {dasdf dsdddds
                toast.warning(errors.cart);
            }

            return;
        }

        try {
            setLoading(true);

            const order = await orderService.checkout({
                address_id: selectedAddressId,
                payment_method: paymentMethod,
            });

            if (!order.id) {
                toast.error('Không lấy được mã đơn hàng');
                return;
            }

            const method = order.paymentMethod;

            if (method === 'cod') {
                setOrderCreated(true);

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

            try {
                const payment = await paymentService.pay(order.id, method);

                setOrderCreated(true);

                await fetchCart();

                if (payment.paymentUrl) {
                    window.location.href = payment.paymentUrl;
                    return;
                }

                toast.success('Đặt hàng và tạo thanh toán thành công');

                navigate(`/order-success/${order.id}`, {
                    replace: true,
                    state: {
                        orderCode: order.orderCode,
                        paymentMethod: method,
                    },
                });
            } catch (paymentError) {
                console.error('Payment error:', paymentError);

                setOrderCreated(false);

                toast.error(
                    paymentError?.message ||
                        paymentError?.response?.data?.message ||
                        'Không thể tạo thanh toán cho đơn hàng này',
                );

                return;
            }
        } catch (error) {
            console.error('Checkout error:', error);

            setOrderCreated(false);

            toast.error(error?.message || error?.response?.data?.message || 'Không thể đặt hàng');
        } finally {
            setLoading(false);
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
                            onChange={(method) => {
                                setPaymentMethod(method);

                                setErrors((prev) => ({
                                    ...prev,
                                    paymentMethod: '',
                                }));
                            }}
                        />
                    </div>

                    <CheckoutSummary
                        items={cartItems}
                        subtotal={subtotal}
                        totalItems={totalItems}
                        onCheckout={handleCheckout}
                        loading={loading || orderCreated}
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
