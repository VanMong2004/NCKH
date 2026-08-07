import { Camera, Mail, Phone, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { withMinimumDelay } from '../../utils/demoDelay';

export default function ProfileForm({ user }) {
    const { refreshUser } = useAuth();

    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [avatarFile, setAvatarFile] = useState(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        mssv: '',
        avatar: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                mssv: user.mssv || '',
                avatar: user.avatar || '',
            });

            setAvatarFile(null);
        }
    }, [user]);

    const avatarUrl = useMemo(() => {
        const name = encodeURIComponent(form.name || form.email || 'User');

        return form.avatar || `https://ui-avatars.com/api/?name=${name}&background=0f172a&color=fff`;
    }, [form.avatar, form.name, form.email]);

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

    function handleAvatarChange(e) {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Avatar không được vượt quá 2MB');
            return;
        }

        setAvatarFile(file);

        setForm((prev) => ({
            ...prev,
            avatar: URL.createObjectURL(file),
        }));
    }

    function validate() {
        const nextErrors = {};

        if (!form.name.trim()) {
            nextErrors.name = 'Vui lòng nhập họ tên';
        }

        if (!form.email.trim()) {
            nextErrors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            nextErrors.email = 'Email không hợp lệ';
        }

        const normalizedPhone = normalizePhone(form.phone);

        if (!normalizedPhone) {
            nextErrors.phone = 'Vui lòng nhập số điện thoại.';
        } else if (!/^0\d{9}$/.test(normalizedPhone)) {
            nextErrors.phone = 'Số điện thoại phải gồm đúng 10 số và bắt đầu bằng số 0.';
        }

        if (form.mssv && form.mssv.trim().length > 50) {
            nextErrors.mssv = 'Mã số sinh viên không được vượt quá 50 ký tự';
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);

            const payload = new FormData();

            payload.append('_method', 'PUT');
            payload.append('name', form.name.trim());
            payload.append('email', form.email.trim());
            payload.append('phone', normalizePhone(form.phone));
            payload.append('mssv', form.mssv.trim());

            if (avatarFile) {
                payload.append('avatar', avatarFile);
            }

            await withMinimumDelay(authService.updateProfile(payload));

            await refreshUser();

            setAvatarFile(null);

            toast.success('Đã cập nhật thông tin');
        } catch (error) {
            toast.error(error.message || 'Không thể cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Thông tin hồ sơ</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Cập nhật thông tin cá nhân dùng cho tài khoản và đơn hàng.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[180px_1fr]">
                <div className="text-center">
                    <div className="relative mx-auto h-32 w-32">
                        <img
                            src={avatarUrl}
                            alt={form.name || 'Avatar'}
                            className="h-32 w-32 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 rounded-full bg-white p-2 text-blue-950 shadow transition hover:bg-slate-50 dark:bg-slate-800 dark:text-blue-300"
                        >
                            <Camera size={18} />
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>

                    <p className="mt-3 text-sm font-bold text-blue-950 dark:text-white">{form.name || 'Người dùng'}</p>

                    <p className="mt-1 text-xs text-slate-500">Bấm icon camera để đổi ảnh</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Input
                        icon={UserRound}
                        label="Họ tên"
                        value={form.name}
                        error={errors.name}
                        onChange={(v) => handleChange('name', v)}
                    />

                    <Input
                        label="Mã sinh viên"
                        value={form.mssv}
                        error={errors.mssv}
                        onChange={(v) => handleChange('mssv', v)}
                        placeholder="Không bắt buộc"
                    />

                    <Input
                        icon={Phone}
                        label="Số điện thoại"
                        value={form.phone}
                        error={errors.phone}
                        onChange={(v) => handleChange('phone', normalizePhone(v))}
                    />

                    <Input
                        icon={Mail}
                        label="Email"
                        value={form.email}
                        error={errors.email}
                        onChange={(v) => handleChange('email', v)}
                    />

                    <div className="flex justify-end md:col-span-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-blue-950 px-8 py-3 font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}

function Input({ label, value, onChange, error, placeholder, icon: Icon }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">{label}</span>

            <div
                className={`flex h-12 items-center gap-2 rounded-xl border bg-white px-3 text-sm outline-none focus-within:border-blue-950 dark:bg-slate-950 ${
                    error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                }`}
            >
                {Icon && <Icon size={17} className="shrink-0 text-slate-400" />}

                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="min-w-0 flex-1 bg-transparent text-slate-700 outline-none dark:text-white"
                />
            </div>

            {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
        </label>
    );
}

function normalizePhone(value) {
    return String(value || '')
        .replace(/[^\d]/g, '')
        .slice(0, 10);
}
