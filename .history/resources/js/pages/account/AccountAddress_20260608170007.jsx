import { useEffect, useState } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';

import addressService from '../../services/addressService';
import AddressCard from '../../components/account/AddressCard';

const emptyForm = {
    fullName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    addressLine: '',
    postalCode: '',
    isDefault: false,
};

export default function AccountAddress() {
    const [addresses, setAddresses] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadAddresses();
    }, []);

    async function loadAddresses() {
        try {
            setLoading(true);
            const list = await addressService.getAddresses();
            setAddresses(list);
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách địa chỉ');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(field, value) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: '',
        }));
    }

    function validate() {
        const nextErrors = {};

        if (!form.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ tên';
        if (!form.phone.trim()) nextErrors.phone = 'Vui lòng nhập số điện thoại';
        if (!form.province.trim()) nextErrors.province = 'Vui lòng nhập tỉnh/thành';
        if (!form.district.trim()) nextErrors.district = 'Vui lòng nhập quận/huyện';
        if (!form.ward.trim()) nextErrors.ward = 'Vui lòng nhập phường/xã';
        if (!form.addressLine.trim()) nextErrors.addressLine = 'Vui lòng nhập địa chỉ cụ thể';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
        setErrors({});
        setShowForm(false);
    }

    function handleAddNew() {
        setForm(emptyForm);
        setEditingId(null);
        setErrors({});
        setShowForm(true);
    }

    function handleEdit(address) {
        setForm({
            fullName: address.fullName,
            phone: address.phone,
            province: address.province,
            district: address.district,
            ward: address.ward,
            addressLine: address.addressLine,
            postalCode: address.postalCode,
            isDefault: address.isDefault,
        });

        setEditingId(address.id);
        setErrors({});
        setShowForm(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validate()) return;

        try {
            setSubmitting(true);

            if (editingId) {
                await addressService.updateAddress(editingId, form);
                toast.success('Đã cập nhật địa chỉ');
            } else {
                await addressService.createAddress(form);
                toast.success('Đã thêm địa chỉ mới');
            }

            resetForm();
            await loadAddresses();
        } catch (error) {
            toast.error(error.message || 'Không thể lưu địa chỉ');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

        try {
            await addressService.deleteAddress(id);
            toast.success('Đã xóa địa chỉ');
            await loadAddresses();
        } catch (error) {
            toast.error(error.message || 'Không thể xóa địa chỉ');
        }
    }

    async function handleSetDefault(id) {
        try {
            await addressService.setDefault(id);
            toast.success('Đã đặt làm địa chỉ mặc định');
            await loadAddresses();
        } catch (error) {
            toast.error(error.message || 'Không thể đặt địa chỉ mặc định');
        }
    }

    return (
        <Breadcrumb />

        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Địa chỉ nhận hàng</h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý địa chỉ dùng khi thanh toán đơn hàng.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleAddNew}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700"
                >
                    <Plus size={18} />
                    Thêm địa chỉ
                </button>
            </div>

            {showForm && (
                <AddressForm
                    form={form}
                    errors={errors}
                    editing={Boolean(editingId)}
                    submitting={submitting}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                />
            )}

            {loading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-blue-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                    Đang tải địa chỉ...
                </div>
            )}

            {!loading && addresses.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                        <MapPin size={30} />
                    </div>

                    <h2 className="mt-4 text-lg font-bold text-blue-950 dark:text-white">Chưa có địa chỉ</h2>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Thêm địa chỉ để quá trình thanh toán nhanh hơn.
                    </p>
                </div>
            )}

            {!loading && addresses.length > 0 && (
                <section className="grid gap-4">
                    {addresses.map((address) => (
                        <AddressCard
                            key={address.id}
                            address={address}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSetDefault={handleSetDefault}
                        />
                    ))}
                </section>
            )}
        </div>
    );
}

function AddressForm({ form, errors, editing, submitting, onChange, onSubmit, onCancel }) {
    return (
        <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">
                    {editing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
                </h2>

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Input
                    label="Họ tên người nhận"
                    value={form.fullName}
                    error={errors.fullName}
                    onChange={(value) => onChange('fullName', value)}
                    placeholder="Nhập họ tên"
                />

                <Input
                    label="Số điện thoại"
                    value={form.phone}
                    error={errors.phone}
                    onChange={(value) => onChange('phone', value)}
                    placeholder="Nhập số điện thoại"
                />

                <Input
                    label="Tỉnh/Thành phố"
                    value={form.province}
                    error={errors.province}
                    onChange={(value) => onChange('province', value)}
                    placeholder="Ví dụ: Cần Thơ"
                />

                <Input
                    label="Quận/Huyện"
                    value={form.district}
                    error={errors.district}
                    onChange={(value) => onChange('district', value)}
                    placeholder="Ví dụ: Ninh Kiều"
                />

                <Input
                    label="Phường/Xã"
                    value={form.ward}
                    error={errors.ward}
                    onChange={(value) => onChange('ward', value)}
                    placeholder="Ví dụ: An Hòa"
                />

                <Input
                    label="Mã bưu chính"
                    value={form.postalCode}
                    error={errors.postalCode}
                    onChange={(value) => onChange('postalCode', value)}
                    placeholder="Không bắt buộc"
                />

                <div className="sm:col-span-2">
                    <Input
                        label="Địa chỉ cụ thể"
                        value={form.addressLine}
                        error={errors.addressLine}
                        onChange={(value) => onChange('addressLine', value)}
                        placeholder="Số nhà, tên đường, khu vực..."
                    />
                </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-950 dark:text-white">
                <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => onChange('isDefault', e.target.checked)}
                    className="h-4 w-4 accent-blue-950"
                />
                Đặt làm địa chỉ mặc định
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                >
                    Hủy
                </button>

                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700"
                >
                    {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm địa chỉ'}
                </button>
            </div>
        </form>
    );
}

function Input({ label, value, error, onChange, placeholder }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">{label}</span>

            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`h-12 w-full rounded-xl border bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-950 dark:bg-slate-950 dark:text-white ${
                    error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                }`}
            />

            {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
        </label>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <span>Tài khoản</span>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Địa chỉ</span>
        </div>
    );
}
