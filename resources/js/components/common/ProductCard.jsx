import { Link } from 'react-router-dom';

const ProductCard = ({ product, viewMode = 'grid' }) => {
    const name = product?.name || 'Sản phẩm';
    const badge = product?.badge || null;

    // Ảnh đầu tiên từ backend
    const imageUrl = product?.images?.[0]?.url || product?.images?.[0] || '/images/placeholder-product.jpg';

    // Giá hiển thị: lấy giá nhỏ nhất trong variants
    const prices = (product?.variants || []).map((variant) => Number(variant?.price || 0)).filter((price) => price > 0);

    const displayPrice = prices.length > 0 ? Math.min(...prices) : 0;

    // Tình trạng còn hàng
    const inStock = (product?.variants || []).some((variant) => Number(variant?.stock || 0) > 0);

    // Phụ đề dưới tên: có thể đổi tùy bạn
    const subtitle = product?.category?.name || '';

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

        return null;
    };

    if (viewMode === 'list') {
        return (
            <div className="card flex gap-4 p-4">
                <Link to={`/sanpham/${product.id}`} className="relative w-32 h-32 flex-shrink-0 block">
                    {renderBadge()}
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded" />
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
                            <p className="text-sm text-muted">{subtitle}</p>
                        </div>
                    </Link>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-red-600">
                                {displayPrice.toLocaleString('vi-VN')}₫
                            </span>
                            <span className={`text-xs ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                                {inStock ? 'Còn hàng' : 'Hết hàng'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>

                <div className="h-[60px] mb-2 px-4 pt-4">
                    <h3 className="font-semibold text-base truncate line-clamp-2 text-title">{name}</h3>
                    <p className="text-sm text-muted">{subtitle}</p>
                </div>
            </Link>

            <div className="flex items-center justify-between gap-2 px-4 pb-4">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-red-600">{displayPrice.toLocaleString('vi-VN')}₫</span>
                    <span className={`text-xs ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                        {inStock ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
