import { Trash2, Plus, Minus } from 'lucide-react';

export default function CartItem({ item, onQuantityChange, onRemove }) {
    const stock = Number(item.inStock || 0);

    const stockText = stock <= 0 ? 'Hết hàng' : stock <= 5 ? 'Sắp hết hàng' : 'Còn hàng';

    const stockClass = stock <= 0 ? 'text-red-600' : stock <= 5 ? 'text-warning' : 'text-success';

    const imageSrc = item.image || '/images/placeholder-product.jpg';

    return (
        <div className="p-4 md:p-6">
            {/* Mobile */}
            <div className="md:hidden">
                <div className="flex gap-4 mb-4">
                    <div className="flex-shrink-0 w-20 h-20 bg-surface border-default rounded-lg overflow-hidden">
                        <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-title text-sm">{item.name}</h3>
                        <p className="text-xs text-body mt-1">Size: {item.size || '-'}</p>
                        <p className={`text-xs font-medium mt-1 ${stockClass}`}>{stockText}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-lg font-bold text-title">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 btn-secondary px-2 py-1">
                            <button
                                onClick={() => onQuantityChange(item.quantity - 1)}
                                className="p-1 rounded transition-colors"
                                aria-label="Decrease quantity"
                            >
                                <Minus className="w-4 h-4 text-body" />
                            </button>

                            <span className="w-6 text-center text-sm font-medium text-title">{item.quantity}</span>

                            <button
                                onClick={() => onQuantityChange(item.quantity + 1)}
                                className="p-1 rounded transition-colors"
                                aria-label="Increase quantity"
                            >
                                <Plus className="w-4 h-4 text-body" />
                            </button>
                        </div>

                        <button
                            onClick={onRemove}
                            className="p-2 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            aria-label="Remove item"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5 flex gap-4">
                    <div className="flex-shrink-0 w-24 h-24 bg-surface border-default rounded-lg overflow-hidden">
                        <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-title">{item.name}</h3>
                        <p className="text-sm text-body mt-1">Size: {item.size || '-'}</p>
                        <p className="text-sm text-body">Màu: {item.color || '-'}</p>
                        <p className={`text-sm font-medium mt-1 ${stockClass}`}>{stockText}</p>
                    </div>
                </div>

                <div className="col-span-2">
                    <span className="font-semibold text-title">{item.price.toLocaleString('vi-VN')}₫</span>
                </div>

                <div className="col-span-2">
                    <div className="flex items-center gap-2 btn-secondary px-2 py-2 w-fit">
                        <button
                            onClick={() => onQuantityChange(item.quantity - 1)}
                            className="p-1 rounded transition-colors"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="w-4 h-4 text-body" />
                        </button>

                        <span className="w-6 text-center text-sm font-medium text-title">{item.quantity}</span>

                        <button
                            onClick={() => onQuantityChange(item.quantity + 1)}
                            className="p-1 rounded transition-colors"
                            aria-label="Increase quantity"
                        >
                            <Plus className="w-4 h-4 text-body" />
                        </button>
                    </div>
                </div>

                <div className="col-span-2">
                    <span className="font-bold text-title">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                    </span>
                </div>

                <div className="col-span-1">
                    <button
                        onClick={onRemove}
                        className="p-2 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mx-auto block"
                        aria-label="Remove item"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
