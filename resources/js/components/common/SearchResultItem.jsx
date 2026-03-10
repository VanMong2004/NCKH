import { Link } from "react-router-dom";

export default function SearchResultItem({ item, closeSearch }) {
    return (
        <Link
            to={`/sanpham/${item.id}`}
            onClick={closeSearch}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors bg-white dark:bg-gray-800"
        >
            <img src={item.image[0]} alt="" className="w-10 h-10 object-cover rounded bg-gray-100 dark:bg-gray-700" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    {item.price.toLocaleString('vi-VN')}₫
                </p>
            </div>
        </Link>
    );
}
