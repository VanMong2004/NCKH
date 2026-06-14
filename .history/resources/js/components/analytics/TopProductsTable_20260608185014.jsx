import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopProductsTable({ products = [] }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Sản phẩm đã mua nhiều</h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Danh sách sản phẩm bạn đã mua với số lượng cao nhất.
                </p>
            </div>

            {products.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-950">
                    <PackageSearch size={40} className="mx-auto text-blue-950 dark:text-blue-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Chưa có dữ liệu sản phẩm.
                    </p>
                </div>
            ) : (
                <>
                    {/* Mobile */}
                    <div className="space-y-3 sm:hidden">
                        {products.map((item, index) => (
                            <Link
                                key={item.productId}
                                to={`/products/${item.slug}`}
                                className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                            >
                                <div>
                                    <p className="text-xs text-slate-500">#{index + 1}</p>

                                    <p className="mt-1 font-bold text-blue-950 dark:text-white">{item.name}</p>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Đã mua</p>

                                    <p className="font-extrabold text-blue-600 dark:text-blue-300">
                                        {item.totalQuantity}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Desktop */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    <th className="py-3">Sản phẩm</th>
                                    <th className="py-3 text-right">Đã mua</th>
                                </tr>
                            </thead>

                            <tbody>
                                {products.map((item) => (
                                    <tr
                                        key={item.productId}
                                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                                    >
                                        <td className="py-4">
                                            <Link
                                                to={`/products/${item.slug}`}
                                                className="font-bold text-blue-950 dark:text-white"
                                            >
                                                {item.name}
                                            </Link>
                                        </td>

                                        <td className="py-4 text-right font-extrabold text-blue-600 dark:text-blue-300">
                                            {item.totalQuantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
}
