import { ChevronRight, Home } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

    const { cartItems, fetchCart } = useCart();

    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null);

    const stateCartItemIds = Array.isArray(location.state?.cartItemIds) ? location.state.cartItemIds : [];

    useEffect(() => {
        fetchCart();
    }, []);

    const checkoutItems = useMemo(() => {
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return [];
        }

        if (stateCartItemIds.length === 0) {
            return cartItems;
        }

        const selectedIds = stateCartItemIds.map((id) => String(id));

        return cartItems.filter((item) => {
            return selectedIds.includes(String(item.cartItemId));
        });
    }, [cartItems, stateCartItemIds]);

    const checkoutCartItemIds = useMemo(() => {
        return checkoutItems.map((item) => Number(item.cartItemId)).filter((id) => Number.isFinite(id) && id > 0);
    }, [checkoutItems]);

    const originalSubtotal = useMemo(() => {
        return checkoutItems.reduce((sum, item) => {
            const originalPrice = Number(item.originalPrice || item.price || 0);

            return sum + originalPrice * Number(item.quantity || 0);
        }, 0);
    }, [checkoutItems]);

    const discountTotal = useMemo(() => {
        return checkoutItems.reduce((sum, item) => {
            const discount = Number(item.discountAmount || 0);

            return sum + discount * Number(item.quantity || 0);
        }, 0);
    }, [checkoutItems]);

    const subtotal = useMemo(() => {
        return checkoutItems.reduce((sum, item) => {
            const finalPrice = Number(item.finalPrice || item.price || 0);

            return sum + finalPrice * Number(item.quantity || 0);
        }, 0);
    }, [checkoutItems]);

    const checkoutTotalItems = useMemo(() => {
        return checkoutItems.reduce((sum, item) => {
            return sum + Number(item.quantity || 0);
        }, 0);
    }, [checkoutItems]);

    const shippingFee = 0;
    const grandTotal = subtotal + shippingFee;

    function validate() {
        const nextErrors = {};

        if (!pendingPaymentOrder && checkoutItems.length === 0) {
            nextErrors.cart = 'Vui lòng chọn sản phẩm cần thanh toán';
        }

        if (!pendingPaymentOrder && checkoutCartItemIds.length === 0) {
            nextErrors.cart = 'Danh sách sản phẩm thanh toán không hợp lệ';
        }

        if (!pendingPaymentOrder && !selectedAddressId) {
            nextErrors.address = 'Vui lòng chọn địa chỉ nhận hàng';
        }

        if (!paymentMethod) {
            nextErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
        }

        setErrors(nextErrors);

        if (nextErrors.cart) {
            toast.warning(nextErrors.cart);
        }

        if (nextErrors.address) {
            toast.warning(nextErrors.address);
        }

        if (nextErrors.paymentMethod) {
            toast.warning(nextErrors.paymentMethod);
        }

        return Object.keys(nextErrors).length === 0;
    }

    async function handleCheckout() {
        if (loading) return;

        if (!validate()) return;

        try {
            setLoading(true);

            if (pendingPaymentOrder) {
                await payExistingOrder(pendingPaymentOrder);
                return;
            }

            const order = await orderService.checkout({
                address_id: Number(selectedAddressId),
                payment_method: paymentMethod,
                cart_item_ids: checkoutCartItemIds,
            });

            if (!order.id) {
                toast.error('Không lấy được mã đơn hàng');
                return;
            }

            const method = order.paymentMethod || paymentMethod;

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
            const method = order.paymentMethod || paymentMethod;

            const payment = await paymentService.pay(order.id, method);

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
                    paymentMethod: method,
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

                <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
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
                        originalSubtotal={originalSubtotal}
                        subtotal={subtotal}
                        shippingFee={shippingFee}
                        discount={discountTotal}
                        grandTotal={grandTotal}
                        totalItems={checkoutTotalItems}
                        error={errors.cart}
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

            <Link to="/cart" className="hover:text-blue-950 dark:hover:text-blue-300">
                Giỏ hàng
            </Link>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Thanh toán</span>
        </div>
    );
}
