export function mapBlog(item = {}) {
    return {
        id: item.id,
        title: item.title || '',
        slug: item.slug || '',
        excerpt: item.excerpt || item.summary || '',
        content: item.content || '',
        thumbnail: item.thumbnail || item.image || '/images/no-image.png',
        category: item.category || 'Tin tức',
        authorName: item.author_name || item.author || 'Quản trị viên',
        viewCount: Number(item.view_count || 0),
        publishedAt: item.published_at || item.created_at || '',
        relatedPosts: Array.isArray(item.related_posts) ? item.related_posts.map(mapBlog) : [],
        raw: item,
    };
}

export function mapBlogListResponse(response = {}) {
    const raw = response.data?.data || response.data || [];

    return {
        blogs: Array.isArray(raw) ? raw.map(mapBlog) : [],
        meta: {
            currentPage: Number(response.data?.current_page || response.meta?.current_page || 1),
            lastPage: Number(response.data?.last_page || response.meta?.last_page || 1),
            total: Number(response.data?.total || response.meta?.total || raw.length || 0),
        },
    };
}

export function mapBlogDetailResponse(response = {}) {
    return mapBlog(response.data || response.blog || response);
}
