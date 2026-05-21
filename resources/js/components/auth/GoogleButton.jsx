import { FcGoogle } from 'react-icons/fc';

export default function GoogleButton() {
    return (
        <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white py-3 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => {
                alert('Chức năng đăng nhập Google sẽ được tích hợp sau.');
            }}
        >
            <FcGoogle size={22} />
            Tiếp tục với Google
        </button>
    );
}
