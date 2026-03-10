// components/account/OrdersHistory/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, totalItems, startIndex, itemsPerPage, onPageChange }) {
    return (
        <div className="card p-4 flex items-center justify-between">
            <p className="text-sm text-muted">
                Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} trên {totalItems} đơn hàng
            </p>

            <div className="flex items-center gap-2">
                {/* Nút Previous */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn-secondary p-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Số trang */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page ? 'bg-blue-600 text-white hover:bg-blue-700' : 'btn-secondary'
                        }`}
                    >
                        {page}
                    </button>
                ))}

                {/* Nút Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn-secondary p-2"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
