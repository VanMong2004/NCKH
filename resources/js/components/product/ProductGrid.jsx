import ProductCard from './ProductCard';

export default function ProductGrid({ products = [] }) {
    return (
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
