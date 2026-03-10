import { useState } from 'react';
import { Package } from 'lucide-react';
import OrdersTabs from '../account/ordershistory/OrdersTabs';
import OrdersFilters from '../account/ordershistory/OrdersFilters';
import OrderCard from '../account/ordershistory/OrderCard';
import Pagination from './ordershistory/Pagination';
import { mockOrdersHistory, STATUS_TABS } from '../../data/mockOrderHistory';

export default function OrdersHistory() {
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Lọc đơn hàng theo tab và tìm kiếm
    const filteredOrders = mockOrdersHistory.filter((order) => {
        const matchTab = activeTab === 'all' || order.status === activeTab;
        const matchSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    // Sắp xếp đơn hàng
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.placedDate) - new Date(a.placedDate);
        }
        return new Date(a.placedDate) - new Date(b.placedDate);
    });

    // Phân trang
    const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const displayedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-title">Lịch sử đơn hàng</h2>
                    <span className="text-muted text-sm">{sortedOrders.length} đơn hàng</span>
                </div>
                <p className="text-muted text-sm">Quản lý và theo dõi tất cả đơn hàng của bạn</p>
            </div>

            {/* Tabs và Filters */}
            <div className="card overflow-hidden">
                <OrdersTabs
                    tabs={STATUS_TABS}
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        setActiveTab(tab);
                        setCurrentPage(1);
                    }}
                />
                <OrdersFilters
                    searchQuery={searchQuery}
                    sortBy={sortBy}
                    onSearchChange={(query) => {
                        setSearchQuery(query);
                        setCurrentPage(1);
                    }}
                    onSortChange={(sort) => {
                        setSortBy(sort);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Danh sách đơn hàng */}
            {displayedOrders.length > 0 ? (
                <div className="space-y-4">
                    {displayedOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <Package className="w-16 h-16 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-title mb-2">Không có đơn hàng nào</h3>
                    <p className="text-muted mb-6">
                        {searchQuery
                            ? `Không tìm thấy đơn hàng với từ khóa "${searchQuery}"`
                            : `Bạn chưa có đơn hàng ${activeTab !== 'all' ? 'ở trạng thái này' : 'nào'}`}
                    </p>
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="btn-primary">
                            Xóa tìm kiếm
                        </button>
                    )}
                </div>
            )}

            {/* Phân trang */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={sortedOrders.length}
                    startIndex={startIndex}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
}
