import { useState } from 'react';
import { Lock, Loader2, Check, ArrowRight, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';

function CheckoutOrder({ items, onValidateForm, checkoutData }) {
    const { clearCart } = useCart();
    const navigate = useNavigate();

    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = 30000;
    const total = subtotal + shippingCost;

    const handlePayment = async () => {
        if (!items || items.length === 0) {
            toast.error('Giỏ hàng trống');
            return;
        }

        if (onValidateForm && !onValidateForm()) return;

        setIsLoading(true);

        try {
            const newOrder = await orderService.checkout({
                shipping_name: checkoutData?.fullName || '',
                shipping_phone: checkoutData?.phone || '',
                shipping_address: checkoutData?.address || '',
                payment_method: checkoutData?.paymentMethod || 'cod',
            });

            const orderId = newOrder?.data?.id || newOrder?.order?.id || newOrder?.id;

            if (!orderId) {
                throw new Error('Không lấy được mã đơn hàng');
            }

            setCreatedOrderId(orderId);

            if (checkoutData?.paymentMethod === 'cod') {
                toast.success('Đặt hàng thành công!');
                setIsSuccess(true);
                return;
            }

            const paymentResult = await paymentService.pay(orderId);

            if (paymentResult?.status === 'success') {
                toast.success(paymentResult?.message || 'Thanh toán thành công!');
                await clearCart();
                setIsSuccess(true);
            } else {
                toast.error(paymentResult?.message || 'Thanh toán thất bại');
                navigate(`/donhang/${orderId}`);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || error?.message || 'Có lỗi khi tạo đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="sticky top-20">
                <div className="card p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-success" strokeWidth={3} />
                    </div>

                    <h2 className="text-2xl font-bold text-title mb-2">Thanh toán thành công!</h2>

                    <p className="text-body mb-6">
                        Mã đơn hàng: <span className="font-bold text-title">#{createdOrderId}</span>
                    </p>

                    <div className="space-y-3">
                        <Link
                            to={`/donhang/${createdOrderId}`}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            Xem đơn hàng <ArrowRight className="w-4 h-4" />
                        </Link>

                        <Link to="/" className="btn-secondary w-full flex items-center justify-center gap-2">
                            <Home className="w-4 h-4" /> Về trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="sticky top-20 space-y-4">
            <div className="card p-6 space-y-4">
                <h2 className="text-lg font-bold text-title">Chi tiết thanh toán</h2>

                <div className="space-y-4 max-h-64 overflow-y-auto border-default p-2 rounded-lg">
                    {items.map((item) => (
                        <div key={item.cartItemId} className="flex gap-3">
                            <img
                                src={item.image || '/images/placeholder-product.jpg'}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded border-default"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-title">{item.name}</p>
                                <p className="text-xs text-muted">
                                    {item.size ? `Size: ${item.size}` : ''} {item.color ? `- Màu: ${item.color}` : ''}
                                </p>
                            </div>
                            <div className="text-sm text-right">
                                <div className="font-medium text-title">{item.price.toLocaleString('vi-VN')}₫</div>
                                <div className="text-xs text-muted">x {item.quantity}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-2 text-sm text-body">
                    <div className="flex justify-between">
                        <span>Tạm tính</span>
                        <span>{subtotal.toLocaleString('vi-VN')}₫</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Phí vận chuyển</span>
                        <span>{shippingCost === 0 ? 'Miễn phí' : `${shippingCost.toLocaleString('vi-VN')}₫`}</span>
                    </div>
                </div>

                <div className="pt-4 flex justify-between font-bold text-title">
                    <span>Tổng thanh toán</span>
                    <span className="text-blue-600">{total.toLocaleString('vi-VN')}₫</span>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isLoading || items.length === 0}
                    className={`btn-primary w-full py-3.5 flex justify-center gap-2 ${
                        isLoading || items.length === 0 ? 'btn-loading' : ''
                    }`}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
                        </>
                    ) : (
                        'Xác nhận thanh toán'
                    )}
                </button>

                <div className="flex justify-center gap-2 text-xs text-muted">
                    <Lock className="w-3 h-3" /> Bảo mật SSL 256-bit
                </div>
            </div>
        </div>
    );
}

export default CheckoutOrder;
