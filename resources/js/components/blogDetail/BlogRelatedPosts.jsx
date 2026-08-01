import { Link } from 'react-router-dom';

export default function BlogRelatedPosts({ posts = [], title = 'Bai viet moi nhat' }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-black text-blue-950 dark:text-white">{title}</h2>

                <Link to="/blog" className="text-sm font-bold text-blue-600 dark:text-blue-300">
                    Xem tat ca
                </Link>
            </div>

            {posts.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Chua co bai viet nao de hien thi.</p>
            ) : (
                <div className="mt-5 space-y-4">
                    {posts.map((post) => (
                        <Link key={post.id || post.slug} to={`/blog/${post.slug}`} className="flex gap-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                                <img
                                    src={post.thumbnail || '/images/no-image.png'}
                                    alt={post.title}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="line-clamp-2 text-sm font-bold leading-6 text-blue-950 dark:text-white">
                                    {post.title}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    {post.summary || 'Noi dung dang duoc cap nhat.'}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
