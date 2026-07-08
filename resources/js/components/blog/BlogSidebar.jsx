import { Send } from 'lucide-react';
import { toast } from 'react-toastify';

import BlogPostCard from './BlogPostCard';

export default function BlogSidebar({ posts = [] }) {
    return (
        <aside className="hidden space-y-6 lg:block">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-black text-blue-950 dark:text-white">Bài viết phổ biến</h2>

                <div className="mt-5 space-y-4">
                    {posts.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có bài viết phổ biến.</p>
                    ) : (
                        posts.map((post) => <BlogPostCard key={post.id} blog={post} variant="popular" />)
                    )}
                </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <Send size={20} />
                </div>

                <h2 className="mt-4 text-lg font-black text-blue-950 dark:text-white">Đăng ký nhận tin</h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Theo dõi các bài viết, sự kiện và khuyến mãi mới nhất.
                </p>

                <div className="mt-4 space-y-3">
                    <input
                        type="email"
                        placeholder="Nhập email của bạn"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/10"
                    />

                    <button
                        type="button"
                        onClick={() => toast.info('Chức năng đăng ký nhận tin sẽ được kết nối sau.')}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                        <Send size={16} />
                        Đăng ký
                    </button>
                </div>
            </section>
        </aside>
    );
}
