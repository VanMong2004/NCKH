// components/account/OrdersHistory/OrderCard.jsx
import { Link } from 'react-router-dom';
import { Clock, Package, CheckCircle, XCircle, FileText, MapPin, ShoppingBag, RotateCcw, AlertCircle } from 'lucide-react';

// Hàm helper lấy icon theo trạng thái
function getStatusIcon(status) {
    const icons = {
        processing: <Clock className="w-5 h-5" />,
        ready: <Package className="w-5 h-5" />,
        completed: <CheckCircle className="w-5 h-5" />,
        cancelled: <XCircle className="w-5 h-5" />,
    };
    return icons[status] || <Package className="w-5 h-5" />;
}

// Hàm helper lấy class badge theo trạng thái
function getStatusBadgeClass(status) {
    const classes = {
        processing: 'badge-warning',
        ready: 'badge-primary',
        completed: 'badge-success',
        cancelled: 'badge-error',
    };
    return classes[status] || 'badge';
}

export default function OrderCard({ order }) {
    return (
        <div className="card overflow-hidden">
            {/* Thông tin đơn hàng */}
            <div className="p-4 sm:p-6 bg-gray-100 dark:bg-gray-900">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs font-semibold text-muted uppercase mb-1">Ngày đặt</div>
                        <div className="text-sm font-medium text-title">{order.placedDate}</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-muted uppercase mb-1">Tổng tiền</div>
                        <div className="text-sm font-semibold text-title">{order.totalAmount.toLocaleString('vi-VN')}₫</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-muted uppercase mb-1">Mã đơn</div>
                        <div className="text-sm font-medium text-title">#{order.id}</div>
                    </div>
                    <div className="text-right flex items-end justify-end">
                        <Link to={`/donhang/${order.id}`} className="btn-link text-sm">
                            Chi tiết →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Trạng thái và sản phẩm */}
            <div className="p-4 sm:p-6">
                {/* Badge trạng thái */}
                <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-default">
                    <div className={getStatusBadgeClass(order.status) + ' p-2 rounded-full'}>
                        {getStatusIcon(order.status)}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-title">{order.statusLabel}</h3>
                            <span className={getStatusBadgeClass(order.status)}>{order.statusLabel}</span>
                        </div>
                        <p className="text-sm text-body">{order.statusMessage}</p>
                    </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="space-y-4">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex gap-4 p-2 rounded-lg border-default">
                            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-default">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-title mb-1">{item.name}</h4>
                                <div className="text-sm text-muted">
                                    {item.size && <span>Size: {item.size} • </span>}
                                    <span>Số lượng: {item.quantity}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Nút hành động */}
            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 border-t border-default grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.status === 'processing' && (
                    <>
                        <button className="btn-primary flex items-center justify-center gap-2">
                            <Package className="w-4 h-4" />
                            Theo dõi đơn hàng
                        </button>
                        <button className="btn-secondary flex items-center justify-center gap-2">
                            <FileText className="w-4 h-4" />
                            Xem hóa đơn
                        </button>
                    </>
                )}
                {order.status === 'ready' && (
                    <button className="btn-primary flex items-center justify-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Hướng dẫn lấy hàng
                    </button>
                )}
                {order.status === 'completed' && (
                    <>
                        <button className="btn-primary flex items-center justify-center gap-2">
                            <ShoppingBag className="w-4 h-4" />k
                            Mua lại
                        </button>
                        <button className="btn-secondary flex items-center justify-center gap-2">
                            <RotateCcw className="w-4 h-4" />
                            Hoàn trả
                        </button>
                    </>
                )}
                {order.status === 'cancelled' && (
                    <button className="btn-secondary flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Xem lý do hủy
                    </button>
                )}
            </div>
        </div>
    );
}