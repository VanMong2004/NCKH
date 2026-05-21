export default function SectionHeader({ title, className = '' }) {
    return (
        <div className={`mb-4 flex items-center justify-between ${className}`}>
            <h2 className="text-lg font-bold text-blue-950">{title}</h2>

            <a href="#" className="text-xs font-bold text-blue-950">
                View All →
            </a>
        </div>
    );
}
