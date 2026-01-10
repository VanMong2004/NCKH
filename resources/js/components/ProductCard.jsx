import React from "react";
import { ShoppingCart } from "lucide-react";

const ProductCard = ({
    image,
    title,
    author,
    price,
    badge = null,
    onAddToCart,
}) => {
    const renderBadge = () => {
        if (!badge) return null;

        if (badge === "new") {
            return (
                <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-white text-xs font-semibold px-2 py-1 rounded">
                    New
                </div>
            );
        }

        if (badge === "sale") {
            return (
                <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    Sale
                </div>
            );
        }
    };

    return (
        <div className="bg-white rounded-lg border overflow-hidden transition-all duration-300 ease-out hover:shadow-sm hover:-translate-y-1 group">
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {renderBadge()}
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-covertransition-transform duration-300 group-hover:scale-105"
                />
            </div>

            <div className="p-3 md:p-4">
                <div className="h-[60px] mb-2">
                    <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2">
                        {title}
                    </h3>
    
                    <p className="text-xs md:text-sm text-gray-600">
                        {author}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <span className="text-base md:text-lg font-bold text-red-600">
                        {price.toLocaleString("vi-VN")}₫
                    </span>

                    <button
                        onClick={onAddToCart}
                        className="px-2 md:px-3 py-1.5 text-xs md:text-sm border rounded-lg transition-colors hover:bg-gray-50 flex items-center gap-1"
                    >
                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Add</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
