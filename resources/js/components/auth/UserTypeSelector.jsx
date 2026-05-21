import { GraduationCap, UserRound } from 'lucide-react';

export default function UserTypeSelector({ value, onChange }) {
    const options = [
        {
            value: 'student',
            label: 'Sinh viên',
            desc: 'Tài khoản dành cho sinh viên',
            icon: GraduationCap,
        },
        {
            value: 'user',
            label: 'Người dùng',
            desc: 'Tài khoản khách hàng thông thường',
            icon: UserRound,
        },
    ];

    return (
        <div>
            <p className="mb-2 text-sm font-bold text-blue-950 dark:text-white">Loại tài khoản</p>

            <div className="grid gap-3 sm:grid-cols-2">
                {options.map((item) => {
                    const Icon = item.icon;
                    const active = value === item.value;

                    return (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => onChange(item.value)}
                            className={`rounded-xl border p-4 text-left transition ${
                                active
                                    ? 'border-blue-950 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
                                    : 'border-slate-300 bg-white hover:border-blue-950 dark:border-slate-700 dark:bg-slate-950'
                            }`}
                        >
                            <div className="mb-2 flex items-center gap-2">
                                <Icon
                                    size={20}
                                    className={active ? 'text-blue-950 dark:text-blue-300' : 'text-slate-500'}
                                />

                                <span className="font-bold text-blue-950 dark:text-white">{item.label}</span>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
