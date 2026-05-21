import { Loader2, Mail, MapPin, Phone, User } from 'lucide-react';

export default function ReceiverForm({
    receiver,
    errors = {},
    addresses = [],
    selectedAddressId,
    loadingAddress,
    onChange,
    onSelectAddress,
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
                <MapPin size={20} className="text-blue-950 dark:text-blue-300" />
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Thông tin nhận hàng</h2>
            </div>

            {loadingAddress ? (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    <Loader2 size={18} className="animate-spin" />
                    Đang tải địa chỉ...
                </div>
            ) : addresses.length > 0 ? (
                <div className="mb-5">
                    <label className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">
                        Chọn địa chỉ đã lưu
                    </label>

                    <select
                        value={selectedAddressId}
                        onChange={(e) => onSelectAddress(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                        <option value="">Nhập địa chỉ mới</option>

                        {addresses.map((address) => (
                            <option key={address.id} value={address.id}>
                                {(address.full_name || 'Người nhận') + ' - ' + (address.phone || '')}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                    Bạn chưa có địa chỉ lưu sẵn. Vui lòng nhập thông tin nhận hàng.
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <Input
                    label="Họ tên người nhận"
                    icon={<User size={18} />}
                    value={receiver.name}
                    error={errors.name}
                    onChange={(value) => onChange('name', value)}
                    placeholder="Nhập họ tên"
                />

                <Input
                    label="Số điện thoại"
                    icon={<Phone size={18} />}
                    value={receiver.phone}
                    error={errors.phone}
                    onChange={(value) => onChange('phone', value)}
                    placeholder="Nhập số điện thoại"
                />

                <Input
                    label="Email"
                    icon={<Mail size={18} />}
                    value={receiver.email}
                    error={errors.email}
                    onChange={(value) => onChange('email', value)}
                    placeholder="Nhập email"
                />

                <Input
                    label="Địa chỉ nhận hàng"
                    icon={<MapPin size={18} />}
                    value={receiver.address}
                    error={errors.address}
                    onChange={(value) => onChange('address', value)}
                    placeholder="Nhập địa chỉ"
                />
            </div>

            <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">Ghi chú</span>

                <textarea
                    value={receiver.note}
                    onChange={(e) => onChange('note', e.target.value)}
                    rows={3}
                    placeholder="Ghi chú cho đơn hàng nếu có"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
            </label>
        </section>
    );
}

function Input({ label, icon, value, error, onChange, placeholder }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">{label}</span>

            <div
                className={`flex h-12 items-center gap-3 rounded-xl border bg-white px-3 dark:bg-slate-950 ${
                    error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                }`}
            >
                <span className="text-slate-400">{icon}</span>

                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none dark:text-white"
                />
            </div>

            {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
        </label>
    );
}
