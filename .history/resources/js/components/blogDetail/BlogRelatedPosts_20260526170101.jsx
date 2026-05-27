import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlogRelatedPosts({ posts = [], title = 'Bài viết liên quan', compact = false }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-black text-blue-950 dark:text-white">{title}</h2>

                {!compact ? (
                    <Link
                        to="/blog"
                        className="text-sm font-black text-blue-600 transition hover:text-blue-800 dark:text-blue-300"
                    >
                        Xem tất cả
                    </Link>
                ) : null}
            </div>

            {posts.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Chưa có bài viết liên quan trong cùng danh mục.
                </p>
            ) : (
                <div className={['mt-5 gap-4', compact ? 'space-y-4' : 'grid sm:grid-cols-2 lg:grid-cols-4'].join(' ')}>
                    {posts.map((post) => (
                        <RelatedPostCard key={post.id || post.slug} post={post} compact={compact} />
                    ))}
                </div>
            )}
        </section>
    );
}

function RelatedPostCard({ post, compact }) {
    if (compact) {
        return (
            <Link to={`/blog/${post.slug}`} className="group flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <img
                        src={post.thumbnail || '/images/no-image.png'}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-black leading-snug text-blue-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                        {post.title}
                    </h3>

                    <div className="mt-2 inline-flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-300">
                        Đọc tiếp
                        <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
            <Link to={`/blog/${post.slug}`} className="block">
                <div className="h-36 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                        src={post.thumbnail || '/images/no-image.png'}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                </div>

                <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-black leading-snug text-blue-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                        {post.title}
                    </h3>

                    <div className="mt-3 inline-flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-300">
                        Đọc tiếp
                        <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                    </div>
                </div>
            </Link>
        </article>
    );
}
