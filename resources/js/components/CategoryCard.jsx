import React from "react";
import { Link } from "react-router-dom";

const CategoryCard = ({ href, image, alt, title }) => {
    return (
        <Link
            to={href}
            className="group relative h-48 md:h-80 rounded-xl overflow-hidden"
        >
            <img
                src={image}
                alt={alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6">
                <h3 className="text-white font-bold text-sm md:text-xl">
                    {title}
                </h3>
            </div>
        </Link>
    );
};

export default CategoryCard;
