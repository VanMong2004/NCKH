import React from "react";

function Features({icon, title, desc}) {
    return (
        <div className="rounded-lg border p-4 md:p-6 flex gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm md:text-base mb-1">{title}</h3>
              <p className="text-xs md:text-sm text-gray-600">{desc}</p>
            </div>
          </div>
    );
}

export default Features;
