import { useState } from 'react';

export default function ProductTabs({ product }) {
    const [activeTab, setActiveTab] = useState('description');

    const tabs = [
        { key: 'description', label: 'Mô tả' },
        { key: 'specs', label: 'Thông tin sản phẩm' },
        { key: 'guide', label: 'Hướng dẫn mua hàng' },
    ];

    const hasSizeOptions = Array.isArray(product.availableSizes) && product.availableSizes.length > 0;
    const hasColorOptions = Array.isArray(product.availableColors) && product.availableColors.length > 0;
    const hasVariantOptions = hasSizeOptions || hasColorOptions;

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`shrink-0 px-5 py-4 text-sm font-bold transition ${
                            activeTab === tab.key
                                ? 'border-b-2 border-blue-950 text-blue-950 dark:border-blue-400 dark:text-blue-300'
                                : 'text-slate-500 hover:text-blue-950 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-5">
                {activeTab === 'description' && (
                    <div className="prose max-w-none text-sm leading-7 text-slate-700 dark:prose-invert dark:text-slate-300">
                        {product.description ? (
                            <p>{product.description}</p>
                        ) : (
                            <p>Sản phẩm hiện chưa có mô tả chi tiết.</p>
                        )}
                    </div>
                )}

                {activeTab === 'specs' && (
                    <div className="grid gap-3 text-sm">
                        <InfoRow label="Tên sản phẩm" value={product.name} />
                        <InfoRow label="Danh mục" value={product.categoryName || '—'} />
                        <InfoRow label="Khoa/Đơn vị" value={product.departmentName || '—'} />
                        <InfoRow label="Tình trạng" value={product.inStock ? 'Còn hàng' : 'Hết hàng'} />
                        <InfoRow label="Tồn kho khả dụng" value={product.availableStock ?? product.stock ?? 0} />
                        <InfoRow label="Đã bán" value={product.sold || 0} />
                        <InfoRow label="Số phân loại" value={product.variants?.length || 0} />

                        {hasSizeOptions && <InfoRow label="Size" value={product.availableSizes.join(', ')} />}

                        {hasColorOptions && <InfoRow label="Màu sắc" value={product.availableColors.join(', ')} />}

                        {!hasVariantOptions && (
                            <InfoRow label="Phân loại" value="Sản phẩm không yêu cầu chọn size hoặc màu sắc" />
                        )}
                    </div>
                )}

                {activeTab === 'guide' && (
                    <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                        {hasVariantOptions ? (
                            <>
                                <p>1. Chọn đúng màu sắc, size hoặc phân loại sản phẩm phù hợp.</p>
                                <p>2. Các phân loại hết hàng sẽ không thể chọn hoặc không thể thêm vào giỏ hàng.</p>
                            </>
                        ) : (
                            <>
                                <p>1. Sản phẩm này không yêu cầu chọn size hoặc màu sắc.</p>
                                <p>2. Bạn chỉ cần chọn số lượng cần mua.</p>
                            </>
                        )}

                        <p>3. Bấm “Thêm vào giỏ hàng”.</p>
                        <p>4. Kiểm tra giỏ hàng và tiến hành thanh toán.</p>
                        <p>5. Theo dõi trạng thái đơn hàng trong tài khoản.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

function InfoRow({ label, value }) {
    const displayValue = value === 0 ? 0 : value || '—';

    return (
        <div className="grid grid-cols-[140px_1fr] gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <span className="font-bold text-blue-950 dark:text-white">{label}</span>
            <span className="break-words text-slate-600 dark:text-slate-400">{displayValue}</span>
        </div>
    );
}
