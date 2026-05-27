import { Camera } from 'lucide-react';

export default function ProfileForm({ user }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-blue-950">Profile Information</h2>

            <div className="mt-5 grid gap-6 md:grid-cols-[180px_1fr]">
                <div className="text-center">
                    <div className="relative mx-auto h-32 w-32">
                        <img src={user.avatar} alt={user.name} className="h-32 w-32 rounded-full object-cover" />
                        <button className="absolute bottom-1 right-1 rounded-full bg-white p-2 text-blue-950 shadow">
                            <Camera size={18} />
                        </button>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">JPG, PNG or GIF. Max size 2MB.</p>

                    <button className="mt-4 rounded-lg border border-blue-950 px-6 py-2 text-sm font-bold text-blue-950">
                        Change Avatar
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Full Name" value={user.name} />
                    <Input label="Student ID (MSSV)" value={user.studentId} />
                    <Input label="Phone Number" value={user.phone} />
                    <Input label="Email Address" value={user.email} />
                    <Input label="Faculty" value={user.faculty} />
                    <Input label="Class" value={user.className} />
                    <Input label="Date of Birth" value={user.birthday} full />

                    <div className="md:col-span-2 flex justify-end">
                        <button className="rounded-lg bg-blue-950 px-8 py-3 font-bold text-white">Save Changes</button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Input({ label, value, full = false }) {
    return (
        <label className={full ? 'md:col-span-2' : ''}>
            <span className="mb-2 block text-sm font-bold text-blue-950">{label}</span>
            <input
                defaultValue={value}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-950"
            />
        </label>
    );
}
  