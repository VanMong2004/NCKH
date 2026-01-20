import { useState } from "react";
import ProductCard from "../components/ProductCard";
import Breadcrumb from "../components/Breadcrumb";
import mockProducts from "../data/mockProducts";
import { Grid3x3, List } from "lucide-react";

const categories = [
    { name: "Tất cả", count: mockProducts.length },
    { name: "Đồng phục Nam", count: 10 },
    { name: "Đồng phục Nữ", count: 3 },
    { name: "Phụ kiện", count: 2 },
];

function ProductsPage() {
    // ========== STATE  ==========
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");
    const [sortBy, setSortBy] = useState("popular");
    const [viewMode, setViewMode] = useState("grid");
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 9;

    // ========== BƯỚC 1: LỌC THEO DANH MỤC ==========
    const filteredByCategory = mockProducts.filter((product) => {
        if (selectedCategory === "Tất cả") return true;
        return product.category === selectedCategory;
    });

    // ========== BƯỚC 2: SẮP XẾP ==========
    let sortedProducts = [...filteredByCategory]; // Copy mảng để không ảnh hưởng gốc

    if (sortBy === "price_asc") {
        sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
        sortedProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
        sortedProducts.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "popular") {
        sortedProducts.sort((a, b) => b.reviews - a.reviews);
    }

    // ========== BƯỚC 3: PHÂN TRANG ==========
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedProducts = sortedProducts.slice(startIndex, endIndex);

    // ========== XỬ LÝ SỰ KIỆN ==========
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1); // Reset về trang 1
    };

    const handleClearFilters = () => {
        setSelectedCategory("Tất cả");
        setCurrentPage(1);
    };;

    return (
        <main className="min-h-screen bg-gray-50">
            {/* ========== BREADCRUMB ========== */}
            <Breadcrumb
                items={["Trang chủ", "Danh mục", "Sản phẩm"]}
                to={["/", "/danh-muc", "san-pham"]}
            />
            {/* ========== MAIN CONTENT ========== */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* ========== SIDEBAR - BỘ LỌC ========== */}
                    <aside className="md:col-span-1">
                        <div className="bg-white rounded-lg border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg">
                                    Bộ lọc
                                </h3>
                                <button
                                    onClick={handleClearFilters}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Xóa tất cả
                                </button>
                            </div>

                            {/* Danh mục */}
                            <div className="mb-6">
                                <h4 className="font-medium mb-3">Danh mục</h4>
                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <label
                                            key={cat.name}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={
                                                    selectedCategory === cat.name
                                                }
                                                onChange={() => handleCategoryChange(cat.name)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm flex-1">
                                                {cat.name}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                ({cat.count})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* ========== DANH SÁCH SẢN PHẨM ========== */}
                    <div className="md:col-span-3">
                        {/* Thanh công cụ */}
                        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap bg-white p-2 rounded-lg border">
                            {/* Sắp xếp */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    Hiển thị{" "}
                                    <span className="font-semibold">
                                        {startIndex + 1}-
                                        {Math.min(
                                            endIndex,
                                            sortedProducts.length,
                                        )}
                                    </span>{" "}
                                    của{" "}
                                    <span className="font-semibold">
                                        {sortedProducts.length}
                                    </span>{" "}
                                    sản phẩm
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-gray-700">
                                    Sắp xếp:
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3 py-2 border rounded-lg text-sm"
                                >
                                    <option value="popular">Phổ biến</option>
                                    <option value="newest">Mới nhất</option>
                                    <option value="price_asc">
                                        Giá: Thấp đến cao
                                    </option>
                                    <option value="price_desc">
                                        Giá: Cao đến thấp
                                    </option>
                                    <option value="rating">
                                        Đánh giá tốt nhất
                                    </option>
                                </select>
                                {/* Chuyển đổi view Grid/List */}

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-2 rounded-lg ${
                                            viewMode === "grid"
                                                ? "bg-gray-900 text-white"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        <Grid3x3 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`p-2 rounded-lg ${
                                            viewMode === "list"
                                                ? "bg-gray-900 text-white"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Grid sản phẩm */}
                        {displayedProducts.length > 0 ? (
                            <div
                                className={
                                    viewMode === "grid"
                                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                                        : "space-y-4"
                                }
                            >
                                {displayedProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">
                                    Không tìm thấy sản phẩm
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <button
                                    onClick={() =>
                                        setCurrentPage(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                                >
                                    ← Previous
                                </button>

                                {/* Hiển thị các số trang */}
                                {Array.from({ length: totalPages },(_, i) => i + 1,).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-lg ${
                                            page === currentPage
                                                ? "bg-blue-600 text-white"
                                                : "border hover:bg-gray-50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() =>
                                        setCurrentPage(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default ProductsPage;
