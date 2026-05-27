import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileForm({ user }) {
    const { refreshUser } = useAuth();

    const [loading, setLoading] = useState(false);

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
        }
    }, [user]);

    function handleChange(field, value) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    async function handleSubmit() {
        try {
            setLoading(true);

            await authService.updateProfile(form);

            await refreshUser();

            toast.success('Đã cập nhật thông tin');
        } catch (error) {
            toast.error(error.message || 'Không thể cập nhật');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section
            className="
rounded-2xl
border
border-slate-200
bg-white
p-5
shadow-sm
dark:border-slate-800
dark:bg-slate-900
"
        >
            <h2
                className="
text-lg
font-bold
text-blue-950
dark:text-white
"
            >
                Thông tin hồ sơ
            </h2>

            <div
                className="
mt-5
grid
gap-6
md:grid-cols-[180px_1fr]
"
            >
                <div className="text-center">
                    <div
                        className="
relative
mx-auto
h-32
w-32
"
                    >
                        <img
                            src={form.avatar || 'https://ui-avatars.com/api/?name=' + form.name}
                            alt={form.name}
                            className="
h-32
w-32
rounded-full
object-cover
"
                        />

                        <button
                            className="
absolute
bottom-1
right-1
rounded-full
bg-white
p-2
text-blue-950
shadow
"
                        >
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                <div
                    className="
grid
gap-4
md:grid-cols-2
"
                >
                    <Input label="Họ tên" value={form.name} onChange={(v) => handleChange('name', v)} />

                    <Input label="Mã sinh viên" value={form.mssv} onChange={(v) => handleChange('mssv', v)} />

                    <Input label="Số điện thoại" value={form.phone} onChange={(v) => handleChange('phone', v)} />

                    <Input label="Email" value={form.email} onChange={(v) => handleChange('email', v)} />

                    <div
                        className="
md:col-span-2
flex
justify-end
"
                    >
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="
rounded-lg
bg-blue-950
px-8
py-3
font-bold
text-white
dark:bg-blue-700
"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Input({ label, value, onChange }) {
    return (
        <label>
            <span
                className="
block
text-sm
font-bold
text-blue-950
dark:text-white
"
            >
                {label}
            </span>

            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="
w-full
rounded-lg
border
border-slate-200
bg-white
px-4
py-3
text-sm
outline-none
focus:border-blue-950
dark:border-slate-700
dark:bg-slate-950
dark:text-white
"
            />
        </label>
    );
}
