import React from 'react';
import { Link } from 'react-router-dom';

const categoryFallbackImages = {
    male: 'https://ss-images.saostar.vn/wp700/pc/1594721994132/28A21F66-767C-4B85-A544-E44EA5E1C387.jpeg',
    female: 'https://dongphuchaianh.com/wp-content/uploads/2022/07/cac-loai-dong-phuc-nhat-ban-dong-phuc-vay-yem.jpg',
    accessory: 'https://haycafe.vn/wp-content/uploads/2022/06/Hinh-anh-hoc-bai.jpg',
    default: 'https://tudonghoangaynay.vn/stores/news_dataimages/2025/022025/15/09/neliti-ai-in-teaching-and-learning20250215092527.jpg?rt:20250215092529',
};

const CategoryCard = ({ name, slug }) => {
    const image = categoryFallbackImages[slug] || categoryFallbackImages.default;
    const href = `/sanpham?category=${slug}`;
    const alt = name;

    return (
        <Link to={href} className="group relative h-48 md:h-80 rounded-xl overflow-hidden block">
            <img
                src={image}
                alt={alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6">
                <h3 className="text-white font-bold text-sm md:text-xl">{name}</h3>
            </div>
        </Link>
    );
};

export default CategoryCard;
