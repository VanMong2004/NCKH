import { HelpCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

function OrderSummary({ total }) {
    const isCartEmpty = total <= 0;

    return (
        <div className="lg:col-span-1">
            <div className="card p-6 sticky top-4">
                <h2 className="text-xl font-bold text-title mb-6">Tổng đơn hàng</h2>

                {/* Tổng cộng */}
                <div className="mb-6 py-4 border-b">
                    <div className="flex justify-between items-end">
                        <span className="text-base font-bold text-title">Tổng cộng</span>
                        <span className="text-2xl font-bold text-blue-600">
                            {(total || 0).toLocaleString('vi-VN')}₫
                        </span>
                    </div>
                </div>

                {/* Nút thanh toán */}
                {isCartEmpty ? (
                    <button disabled className="w-full btn-secondary py-3.5 mb-4 cursor-not-allowed opacity-60">
                        Giỏ hàng trống
                    </button>
                ) : (
                    <Link to="/thanhtoan" className="w-full btn-primary py-3.5 mb-4 flex items-center justify-center">
                        Tiến hành thanh toán
                    </Link>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-muted">
                    <Lock className="w-3 h-3" />
                    Thanh toán bảo mật SSL.
                </div>
            </div>

            {/* Hỗ trợ */}
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 p-4">
                <div className="flex gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-1">Cần hỗ trợ?</h3>
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                            Gọi <span className="font-bold">1900 1234</span> hoặc xem{' '}
                            <Link
                                to="huong-dan-chon-size"
                                className="underline hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                hướng dẫn chọn size
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderSummary;
