import { FcGoogle } from 'react-icons/fc';

export default function GoogleButton({
    disabled = true,
    message = 'Đăng nhập Google sẽ được tích hợp sau.',
}) {
    return (
        <div className="space-y-2">
            <button
                type="button"
                className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-100 py-3 font-bold text-slate-400 opacity-80 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                disabled={disabled}
                title={message}
            >
                <FcGoogle size={22} />
                Đăng nhập với Google
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                {message}
            </p>
        </div>
    );
}
