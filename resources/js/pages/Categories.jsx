import React from 'react';
import Breadcrumb from '../components/common/Breadcrumb';
import CategoryCard from '../components/home/CategoryCard'; // Đảm bảo import đúng đường dẫn component này
import { mockCategory } from '../data/mockCategory';

function CategoryPage() {
    return (
        <main className="bg-page px-4 sm:px-6 lg:px-8 min-h-[60vh]">
            {/* BREADCRUMB */}
            <div className="pt-4">
                <Breadcrumb items={['Trang chủ', 'Danh mục']} to={['/', '/danhmuc']} />
            </div>

            <div className="max-w-7xl mx-auto pb-16 mt-4">
                <div className="mb-8 ml-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-title">Tất cả danh mục</h1>
                </div>

                {/* GRID HIỂN THỊ DANH MỤC */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {mockCategory.map((cat) => (
                        <CategoryCard key={cat.id} {...cat} />
                    ))}
                </div>
            </div>
        </main>
    );
}

export default CategoryPage;
