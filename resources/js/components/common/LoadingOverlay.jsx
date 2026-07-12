import { Loader2 } from 'lucide-react';

export default function LoadingOverlay({
    show = false,
    text = 'Đang xử lý, vui lòng chờ...',
    description = 'Hệ thống đang kiểm tra và cập nhật dữ liệu.',
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                    <Loader2 size={34} className="animate-spin" />
                </div>

                <h3 className="mt-5 text-lg font-extrabold text-blue-950 dark:text-white">
                    {text}
                </h3>

                {description && (
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
