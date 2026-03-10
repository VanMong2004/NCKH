import { useParams, useNavigate } from 'react-router-dom';
import { Download, Truck, CheckCircle, Clock, XCircle, Package, ArrowLeft, MapPin, CreditCard } from 'lucide-react';

import { mockOrdersHistory } from '../data/mockOrderHistory';

function getStatusIcon(status) {
    const icons = {
        processing: <Clock className="w-5 h-5 text-yellow-600" />,
        ready: <Package className="w-5 h-5 text-blue-600" />,
        completed: <CheckCircle className="w-5 h-5 text-green-600" />,
        cancelled: <XCircle className="w-5 h-5 text-red-600" />,
    };
    return icons[status] || <Package className="w-5 h-5" />;
}

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const order = mockOrdersHistory.find((o) => o.id === id);

    if (!order) {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
                <button onClick={() => navigate('/account?tab=orders')} className="btn-primary">
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const total = subtotal + order.shippingFee;

    const handleDownloadInvoice = () => {
        alert(`Download invoice: ${order.id}`);
    };

    const handleTrackOrder = () => {
        alert(`Tracking order: ${order.id}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-muted mb-6 hover:text-title"
            >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
            </button>

            {/* HEADER */}
            <div className="card p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-title">Đơn hàng #{order.id}</h1>
                        <p className="text-sm text-muted mt-1">Đặt ngày {order.placedDate}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleDownloadInvoice} className="btn-secondary flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Download Invoice
                        </button>

                        <button onClick={handleTrackOrder} className="btn-primary flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Track Order
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-semibold">{order.statusLabel}</span>
                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ITEMS */}
                <div className="lg:col-span-2">
                    <div className="card p-6 mb-8">
                        <h2 className="text-lg font-semibold mb-6">Sản phẩm ({order.items.length})</h2>

                        <div className="space-y-6">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex gap-4 border-b border-default pb-6 last:border-0">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-medium text-title">{item.name}</h3>
                                        <p className="text-sm text-muted mt-1">
                                            {item.size && `Size: ${item.size} • `}
                                            Số lượng: {item.quantity}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-semibold">
                                            {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SHIPPING */}
                    <div className="card p-6 mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Địa chỉ giao hàng
                        </h3>

                        <p className="font-medium">{order.shippingAddress.name}</p>
                        <p className="text-muted">{order.shippingAddress.street}</p>
                        <p className="text-muted">{order.shippingAddress.city}</p>
                        <p className="text-muted mt-2">📞 {order.shippingAddress.phone}</p>
                    </div>

                    {/* PAYMENT */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Phương thức thanh toán
                        </h3>

                        <p className="font-medium">{order.paymentMethod.method}</p>
                        <p className="text-green-600 text-sm mt-1">{order.paymentMethod.status}</p>
                    </div>
                </div>

                {/* SUMMARY */}
                <div className="lg:col-span-1">
                    <div className="card p-6 sticky top-20">
                        <h2 className="text-lg font-semibold mb-6">Tóm tắt đơn hàng</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-muted">
                                <span>Tổng phụ</span>
                                <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
                            </div>

                            <div className="flex justify-between text-muted">
                                <span>Phí vận chuyển</span>
                                <span>{order.shippingFee.toLocaleString('vi-VN')} ₫</span>
                            </div>

                            <div className="border-t pt-4 flex justify-between font-bold text-lg">
                                <span>Tổng cộng</span>
                                <span className="text-primary">{total.toLocaleString('vi-VN')} ₫</span>
                            </div>
                        </div>

                        <button className="btn-primary w-full mb-3">In biên lai</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
