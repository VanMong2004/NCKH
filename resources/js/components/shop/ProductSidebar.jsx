import { Search } from 'lucide-react';

export default function ProductSidebar({ filters, filterOptions, onChange, onApply, onReset }) {
    const categories = buildCategoryOptions(filterOptions.categories || []);

    const SIZE_ORDER = {
        XS: 1,
        S: 2,
        M: 3,
        L: 4,
        XL: 5,
        XXL: 6,
        XXXL: 7,
    };

    function handleSubmit(e) {
        e.preventDefault();
        onApply();
    }

    return (
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <form onSubmit={handleSubmit}>
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-blue-950 dark:text-white">Tìm kiếm & bộ lọc</h2>

                    <button
                        type="button"
                        onClick={onReset}
                        className="text-sm font-bold text-red-500 hover:text-red-600"
                    >
                        Xóa lọc
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">Tìm kiếm</span>

                        <div className="flex h-11 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:border-blue-400">
                            <input
                                value={filters.keyword}
                                onChange={(e) => onChange('keyword', e.target.value)}
                                placeholder="Tìm sản phẩm..."
                                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                            />

                            <button
                                type="submit"
                                className="flex w-11 items-center justify-center bg-blue-950 text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                                aria-label="Tìm kiếm"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    <Select
                        label="Sắp xếp"
                        value={filters.sort}
                        onChange={(value) => onChange('sort', value)}
                        options={[
                            { value: 'newest', label: 'Mới nhất' },
                            { value: 'popular', label: 'Phổ biến' },
                            { value: 'best_selling', label: 'Bán chạy' },
                            { value: 'rating', label: 'Đánh giá cao' },
                            { value: 'price_asc', label: 'Giá thấp đến cao' },
                            { value: 'price_desc', label: 'Giá cao đến thấp' },
                        ]}
                    />

                    <Select
                        label="Danh mục"
                        value={filters.category_id}
                        onChange={(value) => onChange('category_id', value)}
                        options={[{ value: '', label: 'Tất cả danh mục' }, ...categories]}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Giá từ"
                            type="number"
                            min="0"
                            value={filters.min_price}
                            onChange={(value) => onChange('min_price', value)}
                        />

                        <Input
                            label="Giá đến"
                            type="number"
                            min="0"
                            value={filters.max_price}
                            onChange={(value) => onChange('max_price', value)}
                        />
                    </div>

                    <Select
                        label="Size"
                        value={filters.sizes}
                        onChange={(value) => onChange('sizes', value)}
                        options={[
                            { value: '', label: 'Tất cả size' },
                            ...(filterOptions.sizes || [])
                                .slice()
                                .sort((a, b) => {
                                    const orderA = SIZE_ORDER[a] ?? 999;
                                    const orderB = SIZE_ORDER[b] ?? 999;

                                    return orderA - orderB;
                                })
                                .map((size) => ({
                                    value: size,
                                    label: size,
                                })),
                        ]}
                    />

                    <Select
                        label="Màu sắc"
                        value={filters.colors}
                        onChange={(value) => onChange('colors', value)}
                        options={[
                            { value: '', label: 'Tất cả màu' },
                            ...(filterOptions.colors || []).map((color) => ({
                                value: color,
                                label: color,
                            })),
                        ]}
                    />

                    <Select
                        label="Đánh giá"
                        value={filters.rating}
                        onChange={(value) => onChange('rating', value)}
                        options={[
                            { value: '', label: 'Tất cả đánh giá' },
                            { value: '5', label: 'Từ 5 sao' },
                            { value: '4', label: 'Từ 4 sao' },
                            { value: '3', label: 'Từ 3 sao' },
                        ]}
                    />

                    <Select
                        label="Tình trạng"
                        value={filters.in_stock}
                        onChange={(value) => onChange('in_stock', value)}
                        options={[
                            { value: '', label: 'Tất cả' },
                            { value: '1', label: 'Còn hàng' },
                        ]}
                    />

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-blue-950 py-3 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                        Áp dụng bộ lọc
                    </button>
                </div>
            </form>
        </aside>
    );
}

function Input({ label, value, onChange, type = 'text', min }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">{label}</span>

            <input
                type={type}
                min={min}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
        </label>
    );
}

function Select({ label, value, onChange, options }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">{label}</span>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
                {options.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function buildCategoryOptions(categories) {
    const options = [];

    categories.forEach((category) => {
        options.push({
            value: String(category.id),
            label: category.name,
        });

        if (category.children?.length > 0) {
            category.children.forEach((child) => {
                options.push({
                    value: String(child.id),
                    label: `— ${child.name}`,
                });
            });
        }
    });

    return options;
}
