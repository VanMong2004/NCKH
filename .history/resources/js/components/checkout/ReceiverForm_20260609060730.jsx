import { Loader2, MapPin, Plus, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import addressService from '../../services/addressService';

export default function ReceiverForm({ selectedAddressId, onSelectAddress, error }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAddresses();
    }, []);

    const selectedAddress = useMemo(() => {
        return addresses.find((item) => String(item.id) === String(selectedAddressId));
    }, [addresses, selectedAddressId]);

    async function loadAddresses() {
        try {
            setLoading(true);

            const list = await addressService.getAddresses();

            setAddresses(list);

            const defaultAddress = list.find((item) => item.isDefault) || list[0];

            if (defaultAddress && !selectedAddressId) {
                onSelectAddress(defaultAddress.id);
            }
        } catch (err) {
            toast.error(err.message || 'Không thể tải danh sách địa chỉ');
        } finally {
            setLoading(false);
        }
    }

    function handleSelect(id) {
        onSelectAddress(id);
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <User size={20} className="text-blue-950 dark:text-blue-300" />

                    <h2 className="text-lg font-bold text-blue-950 dark:text-white">Thông tin nhận hàng</h2>
                </div>

                <Link
                    to="/account/addresses"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-950 px-4 py-2 text-sm font-bold text-blue-950 transition hover:bg-blue-50 dark:border-blue-300 dark:text-blue-300 dark:hover:bg-blue-950/30"
                >
                    <Plus size={16} />
                    Thêm địa chỉ
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    <Loader2 size={18} className="animate-spin" />
                    Đang tải địa chỉ...
                </div>
            ) : addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-950">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                        <MapPin size={26} />
                    </div>

                    <h3 className="mt-3 font-bold text-blue-950 dark:text-white">Chưa có địa chỉ nhận hàng</h3>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Vui lòng thêm địa chỉ ở trang tài khoản trước khi đặt hàng.
                    </p>

                    <Link
                        to="/account/addresses"
                        className="mt-4 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700"
                    >
                        Thêm địa chỉ ngay
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">
                            Chọn địa chỉ đã lưu <span className="text-red-500">*</span>
                        </label>

                        <select
                            value={selectedAddressId || ''}
                            onChange={(e) => handleSelect(e.target.value)}
                            className={`h-12 w-full rounded-xl border bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-950 dark:bg-slate-950 dark:text-white ${
                                error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                            }`}
                        >
                            {addresses.map((address) => (
                                <option key={address.id} value={address.id}>
                                    {address.fullName} - {address.phone}
                                    {address.isDefault ? ' - Mặc định' : ''}
                                </option>
                            ))}
                        </select>

                        {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Họ tên người nhận" value={selectedAddress?.fullName || ''} />

                        <Input label="Số điện thoại" value={selectedAddress?.phone || ''} />

                        <Input label="Tỉnh/Thành phố" value={selectedAddress?.province || ''} />

                        <Input label="Quận/Huyện" value={selectedAddress?.district || ''} />

                        <Input label="Phường/Xã" value={selectedAddress?.ward || ''} />

                        <Input label="Mã bưu chính" value={selectedAddress?.postalCode || ''} />

                        <div className="sm:col-span-2">
                            <Input
                                label="Địa chỉ cụ thể"
                                value={selectedAddress?.addressLine || ''}
                                icon={<MapPin size={17} />}
                            />
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

function Input({ label, value, icon }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">{label}</span>

            <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {icon && <span className="text-slate-400">{icon}</span>}

                <input value={value || ''} readOnly className="min-w-0 flex-1 bg-transparent outline-none" />
            </div>
        </label>
    );
}
