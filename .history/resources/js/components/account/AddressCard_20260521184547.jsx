import { CheckCircle2, Edit3, MapPin, Phone, Star, Trash2, User } from 'lucide-react';

export default function AddressCard({ address, onEdit, onDelete, onSetDefault }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-extrabold text-blue-950 dark:text-white">{address.fullName}</h2>

                        {address.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                <CheckCircle2 size={14} />
                                Mặc định
                            </span>
                        )}
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <Info icon={<User size={16} />} text={address.fullName} />
                        <Info icon={<Phone size={16} />} text={address.phone} />
                        <Info icon={<MapPin size={16} />} text={address.fullAddress} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                    {!address.isDefault && (
                        <button
                            type="button"
                            onClick={() => onSetDefault(address.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/30"
                        >
                            <Star size={16} />
                            Mặc định
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onEdit(address)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                    >
                        <Edit3 size={16} />
                        Sửa
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(address.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                    >
                        <Trash2 size={16} />
                        Xóa
                    </button>
                </div>
            </div>
        </article>
    );
}

function Info({ icon, text }) {
    return (
        <div className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-950 dark:text-blue-300">{icon}</span>
            <span>{text || '—'}</span>
        </div>
    );
}
