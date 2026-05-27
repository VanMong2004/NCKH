import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopProductsTable({ products = [] }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Sản phẩm bán chạy</h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Danh sách sản phẩm có doanh thu cao.</p>
            </div>

            {products.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-950">
                    <PackageSearch size={38} className="mx-auto text-blue-950 dark:text-blue-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Chưa có dữ liệu sản phẩm.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <th className="py-3">Sản phẩm</th>
                                <th className="py-3 text-center">Đã bán</th>
                                <th className="py-3 text-right">Doanh thu</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                                >
                                    <td className="py-4">
                                        <Link
                                            to={`/products/${item.slug}`}
                                            className="font-bold text-blue-950 hover:text-blue-700 dark:text-white"
                                        >
                                            {item.name}
                                        </Link>
                                    </td>

                                    <td className="py-4 text-center font-semibold text-slate-600 dark:text-slate-400">
                                        {item.sold}
                                    </td>

                                    <td className="py-4 text-right font-extrabold text-blue-950 dark:text-blue-300">
                                        {formatMoney(item.revenue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
