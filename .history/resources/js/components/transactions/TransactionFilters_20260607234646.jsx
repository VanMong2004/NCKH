export default function TransactionFilters({ filters, onChange }) {
    const options = [
        {
            value: '',
            label: 'Tất cả',
        },

        {
            value: 'success',
            label: 'Đã thanh toán',
        },

        {
            value: 'pending',
            label: 'Đang chờ',
        },

        {
            value: 'failed',
            label: 'Thất bại',
        },
    ];

    return (
        <div className="mb-6 flex gap-3 overflow-x-auto">
            {options.map((item) => (
                <button
                    key={item.value}
                    onClick={() =>
                        onChange({
                            ...filters,
                            type: item.value,
                        })
                    }
                    className={`rounded-xl px-4 py-3 font-bold whitespace-nowrap ${
                        filters.type === item.value
                            ? 'bg-blue-950 text-white'
                            : 'border border-slate-200 bg-white text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
