import CampaignProductCard from './CampaignProductCard';

export default function CampaignProducts({ products }) {
    return (
        <section className="mt-8">
            <h2 className="mb-5 text-xl font-bold text-blue-950">Sản phẩm trong chiến dịch</h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {products.map((product) => (
                    <CampaignProductCard key={product.id} product={product} />
                ))}
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <strong>Dự kiến giao hàng: 15/06/2024 - 25/06/2024</strong>
                <p className="mt-1">Thông tin thời gian giao hàng có thể thay đổi tùy theo tiến độ sản xuất.</p>
            </div>
        </section>
    );
}
