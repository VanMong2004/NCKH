export default function Button({ children, className = '', ...props }) {
    return (
        <button
            className={`rounded-lg bg-blue-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
