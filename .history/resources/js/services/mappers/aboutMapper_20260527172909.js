function normalizeImage(url) {
    if (!url) return '';

    const value = String(url).trim();

    if (!value) return '';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

export function mapAbout(data = {}) {
    const gallery = Array.isArray(data.gallery) ? data.gallery.map(normalizeImage).filter(Boolean) : [];

    return {
        id: data.id,
        title: data.title || '',
        slogan: data.slogan || '',
        banner: normalizeImage(data.banner),
        description: data.description || '',
        mission: data.mission || '',
        vision: data.vision || '',

        stats: {
            studentCount: Number(data.stats?.student_count || 0),
            majorCount: Number(data.stats?.major_count || 0),
            teacherCount: Number(data.stats?.teacher_count || 0),
            yearsOfOperation: Number(data.stats?.years_of_operation || 0),
        },

        gallery,

        raw: data,
    };
}

export function mapAboutResponse(response = {}) {
    return mapAbout(response.data || {});
}
