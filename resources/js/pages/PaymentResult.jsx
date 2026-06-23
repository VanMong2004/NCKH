import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';

import MainLayout from '../layout/MainLayout';
import paymentService from '../services/paymentService';

export default function PaymentResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [error, setError] = useState('');

    useEffect(() => {
        async function handleResult() {
            const paymentId = searchParams.get('payment_id');
            const status = searchParams.get('status');

            if (!paymentId) {
                setError('Không tìm thấy mã thanh toán.');
                return;
            }

            try {
                const payment = await paymentService.getPaymentDetail(paymentId);

                const orderId = payment.orderId || payment.raw?.order_id || payment.raw?.order?.id;

                if (orderId) {
                    navigate(`/order-success/${orderId}`, {
                        replace: true,
                        state: {
                            paymentStatus: status || payment.status,
                            paymentId,
                        },
                    });

                    return;
                }

                setError('Không tìm thấy đơn hàng tương ứng với thanh toán.');
            } catch (err) {
                console.error('Payment result error:', err);

                setError(err?.message || err?.response?.data?.message || 'Không thể kiểm tra kết quả thanh toán.');
            }
        }

        handleResult();
    }, [navigate, searchParams]);

    if (error) {
        return (
            <MainLayout>
                <main className="mx-auto max-w-3xl px-4 py-16 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <XCircle size={34} />
                    </div>

                    <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">
                        Không thể xử lý kết quả thanh toán
                    </h1>

                    <p className="mt-3 text-slate-600 dark:text-slate-400">{error}</p>

                    <Link
                        to="/account/orders"
                        className="mt-6 inline-flex rounded-xl bg-blue-950 px-5 py-3 font-bold text-white dark:bg-blue-700"
                    >
                        Xem đơn hàng của tôi
                    </Link>
                </main>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-3xl px-4 py-16 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    <Loader2 size={34} className="animate-spin" />
                </div>

                <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">Đang xử lý kết quả thanh toán</h1>

                <p className="mt-3 text-slate-600 dark:text-slate-400">Vui lòng chờ trong giây lát...</p>
            </main>
        </MainLayout>
    );
}
