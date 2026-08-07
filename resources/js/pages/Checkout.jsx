import { ChevronRight, Home } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import MainLayout from '../layout/MainLayout';

import CheckoutSteps from '../components/checkout/CheckoutSteps';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import PaymentMethod from '../components/checkout/PaymentMethod';
import ReceiverForm from '../components/checkout/ReceiverForm';
import LoadingOverlay from '../components/common/LoadingOverlay';

import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import { withMinimumDelay } from '../utils/demoDelay';

const paymentMethodOptions = {
    delivery: ['cod', 'mock_bank'],
    pickup: ['cash_on_pickup', 'mock_bank'],
};

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useAuth();
    const isGuest = !user;

    const { cartItems, fetchCart } = useCart();

    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [saveAddress, setSaveAddress] = useState(false);

    const [receiver, setReceiver] = useState({
        guest_name: '',
        guest_email: user?.email || '',
        guest_phone: user?.phone || '',
        province: '',
        district: '',
        ward: '',
        address_line: '',
        postal_code: '',
    });

    const [fulfillmentMethod, setFulfillmentMethod] = useState('delivery');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null);

    const stateCartItemIds = Array.isArray(location.state?.cartItemIds) ? location.state.cartItemIds : [];

    useEffect(() => {
        fetchCart();
    }, []);

    useEffect(() => {
        if (user) {
            setReceiver((prev) => ({
                ...prev,
                guest_name: prev.guest_name || user.name || '',
                guest_email: prev.guest_email || user.email || '',
                guest_phone: normalizePhone(prev.guest_phone || user.phone || ''),
            }));
        }
    }, [user]);

    useEffect(() => {
        const validMethods = paymentMethodOptions[fulfillmentMethod] || [];

        if (!validMethods.includes(paymentMethod)) {
            setPaymentMethod(validMethods[0] || '');
        }
    }, [fulfillmentMethod, paymentMethod]);

    useEffect(() => {
        setErrors((prev) => {
            const next = { ...prev };

            if (receiver.guest_name.trim()) {
                delete next.guest_name;
            }

            if (
                receiver.guest_email.trim() &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiver.guest_email.trim())
            ) {
                delete next.guest_email;
            }

            if (/^0\d{9}$/.test(normalizePhone(receiver.guest_phone))) {
                delete next.guest_phone;
            }

            if (receiver.province.trim()) {
                delete next.province;
            }

            if (receiver.district.trim()) {
                delete next.district;
            }

            if (receiver.ward.trim()) {
                delete next.ward;
            }

            if (receiver.address_line.trim()) {
                delete next.address_line;
            }

            return next;
        });
    }, [receiver]);

    const checkoutItems = useMemo(() => {
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return [];
        }

        if (stateCartItemIds.length === 0) {
            return cartItems;
        }

        const selectedIds = stateCartItemIds.map((id) => String(id));

        return cartItems.filter((item) => selectedIds.includes(String(item.cartItemId)));
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
        return checkoutItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }, [checkoutItems]);

    const shippingFee = fulfillmentMethod === 'delivery' ? 35000 : 0;
    const grandTotal = subtotal + shippingFee;

    function updateFieldError(field, value) {
        setErrors((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function clearError(field) {
        if (!errors[field]) return;

        updateFieldError(field, '');
    }

    function validate() {
        const nextErrors = {};

        if (!pendingPaymentOrder && checkoutItems.length === 0) {
            nextErrors.cart = 'Vui lòng chọn ít nhất một sản phẩm để đặt hàng.';
        }

        if (!pendingPaymentOrder && checkoutCartItemIds.length === 0) {
            nextErrors.cart = 'Danh sách sản phẩm thanh toán không hợp lệ.';
        }

        if (!pendingPaymentOrder && !selectedAddressId) {
            if (!receiver.guest_name.trim()) {
                nextErrors.guest_name = 'Vui lòng nhập họ tên người nhận.';
            }

            if (!receiver.guest_email.trim()) {
                nextErrors.guest_email = 'Vui lòng nhập email để nhận thông tin đơn hàng.';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiver.guest_email.trim())) {
                nextErrors.guest_email = 'Email phải đúng định dạng, ví dụ: tenban@gmail.com.';
            }

            const normalizedPhone = normalizePhone(receiver.guest_phone);

            if (!normalizedPhone) {
                nextErrors.guest_phone = 'Vui lòng nhập số điện thoại người nhận.';
            } else if (!/^0\d{9}$/.test(normalizedPhone)) {
                nextErrors.guest_phone = 'Số điện thoại phải gồm đúng 10 số và bắt đầu bằng số 0.';
            }

            if (!receiver.province.trim()) {
                nextErrors.province = 'Vui lòng nhập tỉnh hoặc thành phố.';
            }

            if (!receiver.district.trim()) {
                nextErrors.district = 'Vui lòng nhập quận hoặc huyện.';
            }

            if (!receiver.ward.trim()) {
                nextErrors.ward = 'Vui lòng nhập phường hoặc xã.';
            }

            if (!receiver.address_line.trim()) {
                nextErrors.address_line = 'Vui lòng nhập địa chỉ cụ thể.';
            }
        }

        if (!fulfillmentMethod) {
            nextErrors.fulfillment_method = 'Vui lòng chọn phương thức nhận hàng.';
        }

        if (!paymentMethod) {
            nextErrors.payment_method = 'Vui lòng chọn phương thức thanh toán.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function saveGuestOrderToSession(order) {
        if (user) return;

        sessionStorage.setItem(
            'guest_order_success',
            JSON.stringify({
                isGuest: true,
                orderId: order.id,
                orderCode: order.orderCode,
                guestEmail: receiver.guest_email.trim(),
                guestPhone: normalizePhone(receiver.guest_phone),
                guestToken: order.guestToken,
            }),
        );
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

            const payload = {
                fulfillment_method: fulfillmentMethod,
                payment_method: paymentMethod,
                cart_item_ids: checkoutCartItemIds,
            };

            if (selectedAddressId && fulfillmentMethod === 'delivery') {
                payload.address_id = Number(selectedAddressId);
            } else {
                payload.guest_name = receiver.guest_name.trim();
                payload.guest_email = receiver.guest_email.trim();
                payload.guest_phone = normalizePhone(receiver.guest_phone);
                payload.province = receiver.province.trim();
                payload.district = receiver.district.trim();
                payload.ward = receiver.ward.trim();
                payload.address_line = receiver.address_line.trim();
                payload.postal_code = receiver.postal_code.trim();
                payload.save_address = Boolean(
                    user &&
                        saveAddress &&
                        fulfillmentMethod === 'delivery' &&
                        receiver.province.trim() &&
                        receiver.district.trim() &&
                        receiver.ward.trim() &&
                        receiver.address_line.trim(),
                );
            }

            const order = await withMinimumDelay(orderService.checkout(payload));

            if (!order.id) {
                toast.error('Không lấy được mã đơn hàng.');
                return;
            }

            const method = order.paymentMethod || paymentMethod;

            if (method === 'cod' || method === 'cash_on_pickup') {
                sessionStorage.removeItem('mock_payment_qr');

                await fetchCart();

                saveGuestOrderToSession(order);

                toast.success('Đặt hàng thành công.');

                navigate(
                    `/order-success?order_id=${encodeURIComponent(order.id)}&order_code=${encodeURIComponent(order.orderCode)}&status=pending`,
                    {
                        replace: true,
                        state: {
                            isGuest: !user,
                            orderId: order.id,
                            orderCode: order.orderCode,
                            guestPhone: normalizePhone(receiver.guest_phone),
                            paymentMethod: method,
                            paymentStatus: 'unpaid',
                        },
                    },
                );

                return;
            }

            setPendingPaymentOrder(order);

            await payExistingOrder(order, false);
        } catch (error) {
            console.error('Checkout error:', error);

            if (error?.status === 422 && error?.errors) {
                setErrors((prev) => ({
                    ...prev,
                    ...normalizeApiErrors(error.errors),
                }));

                return;
            }

            toast.error(error?.message || 'Không thể đặt hàng.');
        } finally {
            setLoading(false);
        }
    }

    async function payExistingOrder(order, useDemoDelay = true) {
        try {
            const method = order.paymentMethod || paymentMethod;

            const payment = useDemoDelay
                ? await withMinimumDelay(paymentService.pay(order.id, method))
                : await paymentService.pay(order.id, method);

            setPendingPaymentOrder(null);

            await fetchCart();

            if (payment.redirectUrl) {
                saveGuestOrderToSession(order);

                if (method === 'mock_bank') {
                    sessionStorage.setItem(
                        'mock_payment_qr',
                        JSON.stringify({
                            order,
                            payment,
                            callbackUrl: payment.redirectUrl,
                            guestEmail: receiver.guest_email.trim(),
                            guestPhone: normalizePhone(receiver.guest_phone),
                            isGuest: !user,
                        }),
                    );

                    navigate('/payment/qr', {
                        state: {
                            order,
                            payment,
                            callbackUrl: payment.redirectUrl,
                            guestEmail: receiver.guest_email.trim(),
                            guestPhone: normalizePhone(receiver.guest_phone),
                            isGuest: !user,
                        },
                    });

                    return;
                }

                window.location.href = payment.redirectUrl;
                return;
            }

            toast.success('Đặt hàng thành công. Vui lòng thanh toán trong ít phút tới.');

            saveGuestOrderToSession(order);

            navigate(`/order-success?order_code=${encodeURIComponent(order.orderCode)}`, {
                replace: true,
                state: {
                    isGuest: !user,
                    orderCode: order.orderCode,
                    guestPhone: normalizePhone(receiver.guest_phone),
                    paymentMethod: method,
                },
            });
        } catch (paymentError) {
            console.error('Payment error:', paymentError);

            setPendingPaymentOrder(order);

            toast.error(paymentError?.message || 'Không thể tạo thanh toán cho đơn hàng này.');
        }
    }

    return (
        <MainLayout>
            <LoadingOverlay
                show={loading}
                text={pendingPaymentOrder ? 'Đang chuyển sang bước thanh toán...' : 'Đang xử lý đơn hàng...'}
                description="Vui lòng chờ trong giây lát, hệ thống đang kiểm tra giỏ hàng và thông tin thanh toán."
            />

            <main className="mx-auto max-w-7xl px-4 py-6">
                <Breadcrumb />

                <CheckoutSteps />

                <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
                    <div className="space-y-6">
                        <ReceiverForm
                            user={user}
                            receiver={receiver}
                            setReceiver={setReceiver}
                            selectedAddressId={selectedAddressId}
                            onSelectAddress={(id) => {
                                setSelectedAddressId(id);
                                clearError('address');
                            }}
                            saveAddress={saveAddress}
                            onSaveAddressChange={setSaveAddress}
                            errors={errors}
                        />

                        <PaymentMethod
                            fulfillmentMethod={fulfillmentMethod}
                            paymentMethod={paymentMethod}
                            errors={errors}
                            disabled={Boolean(pendingPaymentOrder)}
                            onFulfillmentChange={(method) => {
                                if (pendingPaymentOrder) return;

                                setFulfillmentMethod(method);
                                clearError('fulfillment_method');
                                clearError('payment_method');

                                if (method === 'pickup') {
                                    setSelectedAddressId('');
                                }
                            }}
                            onPaymentChange={(method) => {
                                if (pendingPaymentOrder) return;

                                setPaymentMethod(method);
                                clearError('payment_method');
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
                        buttonText={pendingPaymentOrder ? 'Thanh toán' : 'Đặt hàng'}
                        loadingText={pendingPaymentOrder ? 'Đang chuyển sang bước thanh toán...' : 'Đang xử lý đơn hàng...'}
                    />
                </section>
            </main>
        </MainLayout>
    );
}

function normalizePhone(value) {
    return String(value || '').replace(/[^\d]/g, '').slice(0, 10);
}

function normalizeApiErrors(errors = {}) {
    const mapped = {};

    Object.entries(errors).forEach(([key, value]) => {
        mapped[key] = Array.isArray(value) ? value[0] : value;
    });

    if (mapped.paymentMethod && !mapped.payment_method) {
        mapped.payment_method = mapped.paymentMethod;
    }

    return mapped;
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
