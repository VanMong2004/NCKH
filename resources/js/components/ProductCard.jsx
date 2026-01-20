import React from "react";
import { ShoppingCart } from "lucide-react";

const ProductCard = ({ product, onAddToCart, viewMode = "grid" }) => {
    const { image, title, author, price, badge = null } = product;

    const renderBadge = () => {
        if (!badge) return null;

        if (badge === "new") {
            return (
                <div className="absolute top-2 left-2 bg-white text-xs font-semibold px-2 py-1 rounded">
                    New
                </div>
            );
        }

        if (badge === "sale") {
            return (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    Sale
                </div>
            );
        }
    };

    /* ================= LIST VIEW ================= */
    if (viewMode === "list") {
        return (
            <div className="flex gap-4 bg-white border rounded-lg p-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                    {renderBadge()}
                    <img
                        src={image[0]}
                        alt={title}
                        className="w-full h-full object-cover rounded"
                    />
                </div>

                <div className="flex flex-col justify-between flex-1">
                    <div>
                        <h3 className="font-semibold text-base line-clamp-2">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-600">{author}</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-red-600">
                            {price.toLocaleString("vi-VN")}₫
                        </span>

                        <button
                            onClick={onAddToCart}
                            className="px-3 py-2 text-sm border-2 border-blue-700 text-blue-700 hover:border-red-600 hover:text-red-600 rounded-lg flex items-center gap-1"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Add
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ================= GRID VIEW (DEFAULT) ================= */
    return (
        <div className="bg-white rounded-lg border overflow-hidden transition-all hover:shadow-sm hover:-translate-y-1 group">
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {renderBadge()}
                <img
                    src={image[0]}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>

            <div className="p-4">
                <div className="h-[60px] mb-2">
                    <h3 className="font-semibold text-base line-clamp-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600">{author}</p>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-red-600">
                        {price.toLocaleString("vi-VN")}₫
                    </span>

                    <button
                        onClick={onAddToCart}
                        className="px-3 py-1.5 text-sm border-2 border-blue-700 text-blue-700 hover:border-red-600 hover:text-red-600 rounded-lg flex items-center gap-1"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span className="hidden md:inline">Add</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
