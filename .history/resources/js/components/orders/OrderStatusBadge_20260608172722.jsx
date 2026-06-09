export default function OrderStatusBadge({ status }) {
    const map = {
        pending: {
            label: 'Chờ xử lý',
            className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
        },
        confirmed: {
            label: 'Đã xác nhận',
            className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
        },
        processing: {
            label: 'Đang chuẩn bị',
            className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
        },
        shipping: {
            label: 'Đang giao',
            className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
        },
        success: {
            label: 'Hoàn thành',
            className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        },
        delivered: {
            label: 'Đã giao hàng',
            className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        },
        cancelled: {
            label: 'Đã hủy',
            className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
        },
    };

    const item = map[status] || {
        label: status || 'Chờ xử lý',
        className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    };

    return <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.className}`}>{item.label}</span>;
}
