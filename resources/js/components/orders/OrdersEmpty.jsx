import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrdersEmpty() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <PackageSearch size={48} className="mx-auto text-blue-950" />

            <h2 className="mt-4 text-xl font-bold text-blue-950">Chưa có đơn hàng</h2>

            <p className="mt-2 text-sm text-slate-500">Bạn chưa đặt đơn hàng nào hoặc không có đơn ở trạng thái này.</p>

            <Link to="/shop" className="mt-5 inline-flex rounded-lg bg-blue-950 px-5 py-3 text-sm font-bold text-white">
                Mua sắm ngay
            </Link>
        </div>
    );
}
