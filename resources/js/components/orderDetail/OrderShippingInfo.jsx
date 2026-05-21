import { MapPin, Phone, User } from 'lucide-react';

export default function OrderShippingInfo({ order }) {
    const receiver = order.receiver;

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-bold text-blue-950 dark:text-white">Thông tin nhận hàng</h2>

            <div className="space-y-4">
                <Item icon={<User size={16} />} label="Người nhận" value={receiver.name} />

                <Item icon={<Phone size={16} />} label="Số điện thoại" value={receiver.phone} />

                <Item icon={<MapPin size={16} />} label="Địa chỉ" value={receiver.address} />
            </div>
        </section>
    );
}

function Item({ icon, label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
            <div className="flex gap-3">
                <div className="text-blue-950 dark:text-blue-300">{icon}</div>

                <div>
                    <p className="font-bold dark:text-white">{label}</p>

                    <p className="text-sm text-slate-500">{value || '—'}</p>
                </div>
            </div>
        </div>
    );
}
