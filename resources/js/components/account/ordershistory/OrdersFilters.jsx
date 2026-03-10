// components/account/OrdersHistory/OrdersFilters.jsx
import { Search } from 'lucide-react';

export default function OrdersFilters({ searchQuery, sortBy, onSearchChange, onSortChange }) {
    return (
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 bg-gray-50 dark:bg-gray-900">
            {/* Tìm kiếm */}
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted" />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo mã đơn hàng..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="input-base w-full pl-10"
                />
            </div>

            {/* Sắp xếp */}
            <div className="flex items-center gap-2">
                <label className="label mb-0 whitespace-nowrap">Sắp xếp:</label>
                <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className="input-base">
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                </select>
            </div>
        </div>
    );
}
