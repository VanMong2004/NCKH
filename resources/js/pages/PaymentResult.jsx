import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';

import MainLayout from '../layout/MainLayout';
import { wait } from '../utils/demoDelay';

export default function PaymentResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        async function handleResult() {
            const orderCode = searchParams.get('order_code');
            const status = searchParams.get('status');

            await wait();

            if (!mounted) return;

            if (!orderCode) {
                setError('Không tìm thấy mã đơn hàng.');
                return;
            }

            const guestOrder = JSON.parse(
                sessionStorage.getItem('guest_order_success') || '{}'
            );

            navigate(
                `/order-success?order_code=${encodeURIComponent(orderCode)}&status=${encodeURIComponent(status || '')}`,
                {
                    replace: true,
                    state: {
                        paymentStatus: status,
                        guestPhone: guestOrder.guestPhone,
                        isGuest: guestOrder.isGuest || false,
                    },
                }
            );
        }

        handleResult();

        return () => {
            mounted = false;
        };
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
                        to="/shop"
                        className="mt-6 inline-flex rounded-xl bg-blue-950 px-5 py-3 font-bold text-white dark:bg-blue-700"
                    >
                        Tiếp tục mua sắm
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

                <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">
                    Đang xử lý kết quả thanh toán
                </h1>

                <p className="mt-3 text-slate-600 dark:text-slate-400">
                    Vui lòng chờ trong giây lát...
                </p>
            </main>
        </MainLayout>
    );
}
