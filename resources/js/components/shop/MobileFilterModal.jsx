import { X } from 'lucide-react';

import ProductSidebar from './ProductSidebar';

export default function MobileFilterModal({ open, onClose, filters, filterOptions, onChange, onApply, onReset }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" onClick={onClose} className="absolute inset-0 bg-black/50" aria-label="Đóng bộ lọc" />

            <div className="relative h-full w-[88%] max-w-sm overflow-y-auto bg-slate-50 p-4 shadow-xl dark:bg-slate-950">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-blue-950 dark:text-white">Tìm kiếm và lọc</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Nhập từ khóa hoặc chọn điều kiện lọc
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Đóng"
                    >
                        <X size={22} />
                    </button>
                </div>

                <ProductSidebar
                    filters={filters}
                    filterOptions={filterOptions}
                    onChange={onChange}
                    onApply={onApply}
                    onReset={onReset}
                />
            </div>
        </div>
    );
}
