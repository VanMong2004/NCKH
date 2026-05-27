import { BookOpenCheck, CalendarClock, GraduationCap, UsersRound } from 'lucide-react';

const STAT_ITEMS = [
    {
        key: 'studentCount',
        label: 'Sinh viên',
        desc: 'Quy mô người học',
        icon: UsersRound,
        suffix: '+',
    },
    {
        key: 'majorCount',
        label: 'Ngành đào tạo',
        desc: 'Lĩnh vực chuyên môn',
        icon: BookOpenCheck,
        suffix: '+',
    },
    {
        key: 'teacherCount',
        label: 'Giảng viên',
        desc: 'Đội ngũ hỗ trợ',
        icon: GraduationCap,
        suffix: '+',
    },
    {
        key: 'yearsOfOperation',
        label: 'Năm hoạt động',
        desc: 'Kinh nghiệm vận hành',
        icon: CalendarClock,
        suffix: '+',
    },
];

export default function AboutStats({ stats = {} }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAT_ITEMS.map((item) => (
                <StatCard key={item.key} item={item} value={Number(stats?.[item.key] || 0)} />
            ))}
        </section>
    );
}

function StatCard({ item, value }) {
    const Icon = item.icon;

    return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon size={24} />
            </div>

            <p className="mt-5 text-3xl font-black text-blue-950 dark:text-white">
                {formatNumber(value)}
                {value > 0 ? item.suffix : ''}
            </p>

            <h3 className="mt-1 text-sm font-black text-blue-950 dark:text-white">{item.label}</h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
        </div>
    );
}

function formatNumber(value) {
    if (!value) return '0';

    return new Intl.NumberFormat('vi-VN').format(value);
}
