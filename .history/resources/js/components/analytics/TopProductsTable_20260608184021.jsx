import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopProductsTable({ products = [] }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
                <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">Sản phẩm đã mua nhiều</h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Danh sách sản phẩm bạn đã mua với số lượng cao nhất.
                </p>
            </div>

            {products.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-10 text-center dark:bg-slate-950">
                    <PackageSearch size={42} className="mx-auto text-blue-950 dark:text-blue-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Chưa có dữ liệu sản phẩm.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                                <th className="py-3 text-left text-slate-500">#</th>

                                <th className="py-3 text-left text-slate-500">Sản phẩm</th>

                                <th className="py-3 text-right text-slate-500">Đã mua</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((item, index) => (
                                <tr
                                    key={item.productId}
                                    className="
                                        border-b
                                        border-slate-100
                                        transition
                                        hover:bg-slate-50
                                        last:border-0
                                        dark:border-slate-800
                                        dark:hover:bg-slate-800/40
                                    "
                                >
                                    <td className="py-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                                            {index + 1}
                                        </div>
                                    </td>

                                    <td className="py-4">
                                        <Link
                                            to={`/products/${item.slug}`}
                                            className="font-bold text-blue-950 transition hover:text-blue-700 dark:text-white"
                                        >
                                            {item.name}
                                        </Link>
                                    </td>

                                    <td className="py-4 text-right">
                                        <span className="text-lg font-extrabold text-blue-950 dark:text-blue-300">
                                            {item.totalQuantity}
                                        </span>
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
