import { Loader2, MapPin, Plus, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import addressService from '../../services/addressService';

export default function ReceiverForm({
    user,
    receiver,
    setReceiver,
    selectedAddressId,
    onSelectAddress,
    saveAddress,
    onSaveAddressChange,
    errors = {},
}) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);

    const isGuest = !user;

    useEffect(() => {
        if (user) {
            loadAddresses();
        }
    }, [user]);

    const selectedAddress = useMemo(() => {
        return addresses.find((item) => String(item.id) === String(selectedAddressId));
    }, [addresses, selectedAddressId]);

    useEffect(() => {
        if (!selectedAddress) return;

        setReceiver({
            guest_name: selectedAddress.fullName || '',
            guest_email: user?.email || '',
            guest_phone: selectedAddress.phone || '',
            province: selectedAddress.province || '',
            district: selectedAddress.district || '',
            ward: selectedAddress.ward || '',
            address_line: selectedAddress.addressLine || '',
            postal_code: selectedAddress.postalCode || '',
        });
    }, [selectedAddress, user, setReceiver]);

    async function loadAddresses() {
        try {
            setLoading(true);

            const list = await addressService.getAddresses();
            const nextAddresses = Array.isArray(list) ? list : [];

            setAddresses(nextAddresses);

            const defaultAddress = nextAddresses.find((item) => item.isDefault) || nextAddresses[0];

            if (defaultAddress && !selectedAddressId) {
                onSelectAddress(defaultAddress.id);
            }
        } catch (err) {
            setAddresses([]);
            toast.error(err.message || 'Không thể tải danh sách địa chỉ');
        } finally {
            setLoading(false);
        }
    }

    function updateField(field, value) {
        if (selectedAddressId) {
            onSelectAddress('');
            onSaveAddressChange?.(true);
        }

        setReceiver((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function handleSelectAddress(value) {
        if (value === 'new') {
            onSelectAddress('');
            onSaveAddressChange?.(true);

            setReceiver({
                guest_name: user?.name || '',
                guest_email: user?.email || '',
                guest_phone: user?.phone || '',
                province: '',
                district: '',
                ward: '',
                address_line: '',
                postal_code: '',
            });

            return;
        }

        onSelectAddress(value);
        onSaveAddressChange?.(false);
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <User size={20} className="text-blue-950 dark:text-blue-300" />

                    <h2 className="text-lg font-bold text-blue-950 dark:text-white">
                        Thông tin nhận hàng
                    </h2>
                </div>

                {!isGuest && (
                    <button
                        type="button"
                        onClick={() => handleSelectAddress('new')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-950 px-4 py-2 text-sm font-bold text-blue-950 transition hover:bg-blue-50 dark:border-blue-300 dark:text-blue-300 dark:hover:bg-blue-950/30"
                    >
                        <Plus size={16} />
                        Nhập địa chỉ mới
                    </button>
                )}
            </div>

            {!isGuest && (
                <div className="mb-5">
                    <label className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">
                        Chọn địa chỉ đã lưu
                    </label>

                    {loading ? (
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                            <Loader2 size={18} className="animate-spin" />
                            Đang tải địa chỉ...
                        </div>
                    ) : (
                        <>
                            <select
                                value={selectedAddressId || 'new'}
                                onChange={(e) => handleSelectAddress(e.target.value)}
                                className={`h-12 w-full rounded-xl border bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-950 dark:bg-slate-950 dark:text-white ${
                                    errors.address ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                                }`}
                            >
                                {addresses.map((address) => (
                                    <option key={address.id} value={address.id}>
                                        {address.fullName} - {address.phone}
                                        {address.isDefault ? ' - Mặc định' : ''}
                                    </option>
                                ))}

                                <option value="new">+ Nhập địa chỉ mới</option>
                            </select>

                            {errors.address && (
                                <p className="mt-1 text-xs font-semibold text-red-500">
                                    {errors.address}
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}

            {isGuest && (
                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                    Bạn đang mua hàng với tư cách khách. Địa chỉ chỉ được lưu vào đơn hàng.
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <Input
                    label="Họ tên người nhận"
                    value={receiver.guest_name}
                    error={errors.guest_name}
                    onChange={(value) => updateField('guest_name', value)}
                    required
                />

                <Input
                    label="Số điện thoại"
                    value={receiver.guest_phone}
                    error={errors.guest_phone}
                    onChange={(value) => updateField('guest_phone', value)}
                    required
                />

                <Input
                    label="Email"
                    value={receiver.guest_email}
                    error={errors.guest_email}
                    onChange={(value) => updateField('guest_email', value)}
                    disabled={!isGuest && Boolean(user?.email)}
                />

                <Input
                    label="Tỉnh/Thành phố"
                    value={receiver.province}
                    error={errors.province}
                    onChange={(value) => updateField('province', value)}
                />

                <Input
                    label="Quận/Huyện"
                    value={receiver.district}
                    error={errors.district}
                    onChange={(value) => updateField('district', value)}
                />

                <Input
                    label="Phường/Xã"
                    value={receiver.ward}
                    error={errors.ward}
                    onChange={(value) => updateField('ward', value)}
                />

                <Input
                    label="Mã bưu chính"
                    value={receiver.postal_code}
                    error={errors.postal_code}
                    onChange={(value) => updateField('postal_code', value)}
                    placeholder="Không bắt buộc"
                />

                <div className="sm:col-span-2">
                    <Input
                        label="Địa chỉ cụ thể"
                        value={receiver.address_line}
                        error={errors.address_line}
                        onChange={(value) => updateField('address_line', value)}
                        icon={<MapPin size={17} />}
                    />
                </div>
            </div>

            {!isGuest && !selectedAddressId && (
                <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <input
                        type="checkbox"
                        checked={Boolean(saveAddress)}
                        onChange={(e) => onSaveAddressChange?.(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-950"
                    />
                    Lưu địa chỉ này vào sổ địa chỉ
                </label>
            )}
        </section>
    );
}

function Input({
    label,
    value,
    icon,
    error,
    onChange,
    placeholder,
    required = false,
    disabled = false,
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </span>

            <div
                className={`flex h-12 items-center gap-2 rounded-xl border bg-slate-50 px-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-white ${
                    error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                } ${disabled ? 'opacity-70' : ''}`}
            >
                {icon && <span className="text-slate-400">{icon}</span>}

                <input
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed"
                />
            </div>

            {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
        </label>
    );
}
