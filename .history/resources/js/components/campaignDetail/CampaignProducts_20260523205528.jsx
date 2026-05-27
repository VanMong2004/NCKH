import CampaignProductCard from './CampaignProductCard';

export default function CampaignProducts({ products = [] }) {
    return (
        <section>
            <h2 className="mb-5 text-xl font-bold text-blue-950 dark:text-white">Sản phẩm trong chiến dịch</h2>

            {products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                    <p className="font-bold text-blue-950 dark:text-white">Chưa có sản phẩm trong chiến dịch</p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Danh sách sản phẩm sẽ được cập nhật sau.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                        <CampaignProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                <strong>Thông tin nhận sản phẩm sẽ được cập nhật theo tiến độ chiến dịch.</strong>
                <p className="mt-1">
                    Thời gian nhận sản phẩm có thể thay đổi tùy theo số lượng đăng ký và kế hoạch của đơn vị tổ chức.
                </p>
            </div>
        </section>
    );
}
