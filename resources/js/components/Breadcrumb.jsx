import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"


export default function Breadcrumb({ items, to }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-8">
      {items.map((item, index) => (
        <Link key={index} to={to[index]}>
          <div className="flex items-center gap-2">
            <span className={index === items.length - 1 ? "text-gray-900 font-medium" : "text-gray-600"}>{item}</span>
            {index < items.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          </div>
        </Link>
      ))}
    </nav>
  )
}
