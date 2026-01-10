"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"


export default function ProductImage({ images, badge }j) {
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden h-96">
        <div className="relative w-full h-full">
          <img src={images[selectedImage] || "/placeholder.svg"} alt="Product" className="w-full h-full object-cover" />
        </div>

        {/* Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">{badge}</span>
        </div>

        {/* Navigation Arrows */}
        <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnail Images */}
      <div className="flex gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`w-24 h-24 rounded-lg overflow-hidden border-2 transition ${
              selectedImage === index ? "border-blue-500" : "border-gray-200"
            }`}
          >
            <img
              src={image || "/placeholder.svg"}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
