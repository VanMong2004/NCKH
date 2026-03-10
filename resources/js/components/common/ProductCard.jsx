import { Link } from 'react-router-dom';

const ProductCard = ({ product, viewMode = 'grid' }) => {
    const { image, name, author, price, badge = null } = product;

    const renderBadge = () => {
        if (!badge) return null;

        if (badge === 'new') {
            return (
                <div className="absolute top-2 left-2 bg-surface text-title text-xs font-semibold px-2 py-1 rounded">
                    New
                </div>
            );
        }

        if (badge === 'sale') {
            return (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    Sale
                </div>
            );
        }
    };

    /* ================= LIST VIEW ================= */
    if (viewMode === 'list') {
        return (
            <div className="card flex gap-4 p-4">
                <Link to={`/sanpham/${product.id}`} className="relative w-32 h-32 flex-shrink-0 block">
                    {renderBadge()}
                    <img src={image[0]} alt={name} className="w-full h-full object-cover rounded" />
                </Link>

                <div className="flex flex-col justify-between flex-1">
                    <Link
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth',
                            })
                        }
                        to={`/sanpham/${product.id}`}
                        className="inline-block"
                    >
                        <div>
                            <h3 className="font-semibold text-base line-clamp-2 hover:underline text-title">{name}</h3>
                            <p className="text-sm text-muted">{author}</p>
                        </div>
                    </Link>

                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-red-600">{price.toLocaleString('vi-VN')}₫</span>
                    </div>
                </div>
            </div>
        );
    }

    /* ================= GRID VIEW (DEFAULT) ================= */
    return (
        <div className="card overflow-hidden transition-all hover:shadow-sm hover:-translate-y-1 group">
            <Link
                to={`/sanpham/${product.id}`}
                onClick={() => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                    });
                }}
            >
                <div className="relative aspect-square bg-surface overflow-hidden">
                    {renderBadge()}
                    <img
                        src={image[0]}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>

                <div className="h-[60px] mb-2 px-4 pt-4">
                    <h3 className="font-semibold text-base truncate line-clamp-2 text-title">{name}</h3>
                    <p className="text-sm text-muted">{author}</p>
                </div>
            </Link>

            <div className="flex items-center justify-between gap-2 px-4 pb-4">
                <span className="text-lg font-bold text-red-600">{price.toLocaleString('vi-VN')}₫</span>
            </div>
        </div>
    );
};

export default ProductCard;
