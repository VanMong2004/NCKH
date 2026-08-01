function normalizeImage(url) {
    if (!url) return '/images/no-image.png';

    const value = String(url).trim();

    if (!value) return '/images/no-image.png';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

export function mapBlog(item = {}) {
    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        summary: item.summary || '',
        content: item.content || '',
        thumbnail: normalizeImage(item.thumbnail),
        authorName: item.author_name || 'Ban quan tri CTUT UniShop',
        isFeatured: Boolean(item.is_featured),
        publishedAt: item.published_at || '',
        latestPosts: Array.isArray(item.latest_posts) ? item.latest_posts.map(mapBlog) : [],
        raw: item,
    };
}

export function mapBlogListResponse(response = {}) {
    const rawBlogs = Array.isArray(response.data) ? response.data : [];

    return {
        blogs: rawBlogs.map(mapBlog),
        featuredPost: response.featured_post ? mapBlog(response.featured_post) : null,
        meta: {
            currentPage: Number(response.meta?.current_page || 1),
            lastPage: Number(response.meta?.last_page || 1),
            perPage: Number(response.meta?.per_page || rawBlogs.length || 10),
            total: Number(response.meta?.total || rawBlogs.length || 0),
        },
        message: response.message || '',
        success: Boolean(response.success),
    };
}

export function mapBlogDetailResponse(response = {}) {
    return mapBlog(response.data || {});
}
