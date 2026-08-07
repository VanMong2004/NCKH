import { Building2, MapPin } from 'lucide-react';

export default function PickupForm() {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
                <MapPin size={20} className="text-blue-950 dark:text-blue-300" />
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Thông tin nhận hàng</h2>
            </div>

            <div className="space-y-4">
                <label className="block">
                    <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">
                        Địa điểm nhận hàng <span className="text-red-500">*</span>
                    </span>

                    <select className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                        <option>Phòng Công tác chính trị - Sinh viên - Khởi nghiệp</option>
                    </select>
                </label>

                <div className="flex gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <Building2 size={22} className="mt-1 shrink-0 text-blue-950 dark:text-blue-300" />

                    <div>
                        <p className="font-bold text-blue-950 dark:text-white">
                            Phòng Công tác chính trị - Sinh viên - Khởi nghiệp
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Trường Đại học Kỹ thuật - Công nghệ Cần Thơ
                        </p>
                    </div>
                </div>

                <label className="block">
                    <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">
                        Ghi chú khi nhận hàng
                    </span>

                    <textarea
                        maxLength={300}
                        rows={4}
                        placeholder="Nhập ghi chú khi nhận hàng nếu có..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </label>
            </div>
        </section>
    );
}
