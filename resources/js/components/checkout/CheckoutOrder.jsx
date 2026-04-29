import { useState } from 'react';
import { Lock, Loader2, Check, ArrowRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import orderService from '../../services/orderService';

function CheckoutOrder({ items, onValidateForm, checkoutData }) {
    const { clearCart } = useCart();
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = 30000;
    const total = subtotal + shippingCost;

    const handlePayment = async () => {
        // if (!items || items.length === 0) {
        //     toast.error('Giỏ hàng trống');
        //     return;
        // }
        if (onValidateForm && !onValidateForm()) return;

        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const newOrder = await orderService.createOrder({
                items,
                subtotal,
                shippingFee: shippingCost,
                totalAmount: total,
                shippingAddress: {
                    name: checkoutData?.fullName || 'Chưa cập nhật',
                    phone: checkoutData?.phone || 'Chưa cập nhật',
                    address: checkoutData?.address || 'Chưa cập nhật',
                },

                paymentMethod: {
                    method: paymentMethod === 'cash' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng',
                    status: paymentMethod === 'cash' ? 'Chưa thanh toán' : 'Đã thanh toán',
                },
            });
            setCreatedOrderId(newOrder.id);
            toast.success('Đặt hàng thành công!');
            await clearCart();
            setIsSuccess(true);
        } catch {
            console.error(error);
            toast.error('Có lỗi khi tạo đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    /* =========================
       SUCCESS SCREEN
    ========================= */
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
                            to="/taikhoan?tab=donhang"
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

    /* =========================
       CHECKOUT SCREEN
    ========================= */
    return (
        <div className="sticky top-20 space-y-4">
            <div className="card p-6 space-y-4">
                <h2 className="text-lg font-bold text-title">Chi tiết thanh toán</h2>

                {/* DANH SÁCH SẢN PHẨM */}
                <div className="space-y-4 max-h-64 overflow-y-auto border-default p-2 rounded-lg">
                    {items.map((item) => (
                        <div key={`${item.id}-${item.size}`} className="flex gap-3">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded border-default"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-title">{item.name}</p>
                                <p className="text-xs text-muted">Size: {item.size}</p>
                            </div>
                            <div className="text-sm text-right">
                                <div className="font-medium text-title">{item.price.toLocaleString('vi-VN')}₫</div>
                                <div className="text-xs text-muted">x {item.quantity}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CHI TIẾT GIÁ */}
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

                {/* TỔNG CỘNG */}
                <div className="pt-4 flex justify-between font-bold text-title">
                    <span>Tổng thanh toán</span>
                    <span className="text-blue-600">{total.toLocaleString('vi-VN')}₫</span>
                </div>

                {/* NÚT THANH TOÁN */}
                <button
                    onClick={handlePayment}
                    disabled={isLoading || items.length === 0}
                    className={`btn-primary w-full py-3.5 flex justify-center gap-2 ${isLoading || items.length === 0 ? 'btn-loading' : ''}`}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
                        </>
                    ) : (
                        'Xác nhận thanh toán'
                    )}
                </button>

                {/* BẢO MẬT */}
                <div className="flex justify-center gap-2 text-xs text-muted">
                    <Lock className="w-3 h-3" /> Bảo mật SSL 256-bit
                </div>
            </div>
        </div>
    );
}

export default CheckoutOrder;
