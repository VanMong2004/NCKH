const DEFAULT_ABOUT = {
    title: 'CTUT Shop',
    slogan: 'Kết nối sinh viên với các sản phẩm, chiến dịch và hoạt động của trường',
    banner: '/images/system/Rectangle_3897.jpg',
    description:
        'CTUT Shop là hệ thống hỗ trợ sinh viên, giảng viên và người dùng tiếp cận các sản phẩm, chiến dịch, sự kiện và thông tin chính thức của nhà trường một cách thuận tiện, minh bạch và hiện đại.',
    mission:
        'Xây dựng một nền tảng số giúp tối ưu quá trình đặt hàng, đăng ký chiến dịch, theo dõi giao dịch và nhận thông báo trong môi trường đại học.',
    vision: 'Trở thành kênh kết nối số đáng tin cậy giữa nhà trường, sinh viên và các hoạt động hỗ trợ cộng đồng học tập.',
    stats: {
        studentCount: 0,
        majorCount: 0,
        teacherCount: 0,
        yearsOfOperation: 0,
    },
    gallery: [],
};

function normalizeImage(url) {
    if (!url) return '';

    const value = String(url).trim();

    if (!value) return '';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

function hasValue(data) {
    return data && typeof data === 'object' && Object.keys(data).length > 0;
}

export function mapAbout(data = {}) {
    const source = hasValue(data) ? data : {};

    const gallery = Array.isArray(source.gallery) ? source.gallery.map(normalizeImage).filter(Boolean) : [];

    return {
        id: source.id || null,
        title: source.title || DEFAULT_ABOUT.title,
        slogan: source.slogan || DEFAULT_ABOUT.slogan,
        banner: normalizeImage(source.banner) || DEFAULT_ABOUT.banner,
        description: source.description || DEFAULT_ABOUT.description,
        mission: source.mission || DEFAULT_ABOUT.mission,
        vision: source.vision || DEFAULT_ABOUT.vision,
        stats: {
            studentCount: Number(source.stats?.student_count || source.stats?.studentCount || 0),
            majorCount: Number(source.stats?.major_count || source.stats?.majorCount || 0),
            teacherCount: Number(source.stats?.teacher_count || source.stats?.teacherCount || 0),
            yearsOfOperation: Number(source.stats?.years_of_operation || source.stats?.yearsOfOperation || 0),
        },
        gallery,
        raw: source,
    };
}

export function mapAboutResponse(response = {}) {
    return mapAbout(response.data || response.about || response);
}
