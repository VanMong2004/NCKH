import BlogCard from './BlogCard';

export default function RelatedPosts({ posts = [] }) {
    if (!posts.length) return null;

    return (
        <section className="mt-8">
            <h2 className="mb-5 text-2xl font-extrabold text-blue-950 dark:text-white">Bài viết liên quan</h2>

            <div className="grid gap-5 md:grid-cols-3">
                {posts.map((post) => (
                    <BlogCard key={post.id} blog={post} />
                ))}
            </div>
        </section>
    );
}
