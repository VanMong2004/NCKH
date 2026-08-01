function toNumber(value) {
    return Number(value || 0);
}

function toBoolean(value) {
    return value === true || value === 1 || value === '1';
}

export function normalizeImage(url) {
    if (!url) return '';

    const value = String(url).trim();

    if (!value) return '';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

export function getComponentTypeText(type) {
    const key = String(type || '').toLowerCase();

    const map = {
        section: 'Khối nội dung',
        slider: 'Slider',
        banner: 'Banner',
        menu: 'Menu',
        navigation: 'Thanh điều hướng',
        bottom_navigation: 'Menu mobile',
        footer: 'Chân trang',
        navbar: 'Thanh điều hướng',
        grid: 'Lưới nội dung',
        list: 'Danh sách',
        html: 'Nội dung HTML',
    };

    return map[key] || 'Khối nội dung';
}

export function getPageKeyText(pageKey) {
    const key = String(pageKey || '').toLowerCase();

    const map = {
        home: 'Trang chủ',
        shop: 'Trang sản phẩm',
        promotion: 'Trang khuyến mãi',
        promotions: 'Trang khuyến mãi',
        blog: 'Tin tức',
        faq: 'FAQ',
        about: 'Giới thiệu',
        contact: 'Liên hệ',
        policy: 'Chính sách',
        navbar: 'Thanh điều hướng',
        footer: 'Chân trang',
    };

    return map[key] || 'Khu vực chung';
}

export function getComponentAreaText(componentKey, componentName) {
    const key = String(componentKey || '').toLowerCase();

    const map = {
        navbar: 'Thanh điều hướng',
        mobile_menu: 'Menu điện thoại',
        bottom_navigation: 'Menu dưới mobile',
        footer: 'Chân trang',
        hero_slider: 'Slider trang chủ',
    };

    return map[key] || componentName || 'Khu vực nội dung';
}

export function getComponentPositionText(component = {}) {
    const key = String(component.componentKey || '').toLowerCase();

    const map = {
        navbar: 'Đầu trang',
        mobile_menu: 'Điện thoại',
        bottom_navigation: 'Cuối màn hình mobile',
        footer: 'Cuối trang',
        hero_slider: 'Trang chủ',
    };

    return map[key] || getPageKeyText(component.pageKey);
}

export function getComponentDescription(component = {}) {
    const key = String(component.componentKey || '').toLowerCase();

    const map = {
        navbar: 'Logo, tên shop và menu đầu trang.',
        mobile_menu: 'Menu mở rộng trên điện thoại.',
        bottom_navigation: 'Thanh điều hướng cố định dưới màn hình điện thoại.',
        footer: 'Thông tin liên hệ, liên kết và nội dung cuối trang.',
        hero_slider: 'Banner lớn hiển thị ở trang chủ.',
    };

    return map[key] || component.subtitle || component.title || 'Nội dung hiển thị ngoài website.';
}

export function getComponentManageText(component = {}) {
    const key = String(component.componentKey || '').toLowerCase();

    const map = {
        navbar: 'Sửa menu',
        mobile_menu: 'Sửa menu mobile',
        bottom_navigation: 'Sửa menu dưới',
        footer: 'Sửa chân trang',
        hero_slider: 'Sửa slider',
    };

    return map[key] || 'Sửa';
}

export function mapAdminSiteItem(item = {}) {
    return {
        id: item.id,
        componentId: item.component_id || item.componentId || null,
        parentId: item.parent_id || item.parentId || null,

        groupKey: item.group_key || item.groupKey || '',
        itemKey: item.item_key || item.itemKey || '',
        itemType: item.item_type || item.itemType || 'link',

        label: item.label || '',
        title: item.title || '',
        subtitle: item.subtitle || '',
        content: item.content || '',
        iconKey: item.icon_key || item.iconKey || '',

        image: normalizeImage(item.image),
        mobileImage: normalizeImage(item.mobile_image || item.mobileImage),

        linkText: item.link_text || item.linkText || '',
        linkUrl: item.link_url || item.linkUrl || '',
        target: item.target || '_self',

        payload: item.payload && typeof item.payload === 'object' ? item.payload : {},

        sortOrder: toNumber(item.sort_order || item.sortOrder),
        isActive: toBoolean(item.is_active ?? item.isActive),

        children: Array.isArray(item.children) ? item.children.map(mapAdminSiteItem) : [],

        createdAt: item.created_at || item.createdAt || '',
        updatedAt: item.updated_at || item.updatedAt || '',

        raw: item,
    };
}

export function mapAdminSiteComponent(item = {}) {
    const mapped = {
        id: item.id,

        pageKey: item.page_key || '',
        pageName: item.page_name || getPageKeyText(item.page_key),

        componentKey: item.component_key || '',
        componentName: item.component_name || '',
        componentType: item.component_type || 'section',
        componentTypeText: getComponentTypeText(item.component_type || 'section'),

        title: item.title || '',
        subtitle: item.subtitle || '',
        content: item.content || '',

        image: normalizeImage(item.image),
        mobileImage: normalizeImage(item.mobile_image),

        payload: item.payload && typeof item.payload === 'object' ? item.payload : {},

        sortOrder: toNumber(item.sort_order),
        isActive: toBoolean(item.is_active),

        itemsCount: toNumber(item.items_count || (Array.isArray(item.items) ? item.items.length : 0)),
        items: Array.isArray(item.items) ? item.items.map(mapAdminSiteItem) : [],

        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',

        raw: item,
    };

    return {
        ...mapped,
        areaText: getComponentAreaText(mapped.componentKey, mapped.componentName),
        positionText: getComponentPositionText(mapped),
        descriptionText: getComponentDescription(mapped),
        manageText: getComponentManageText(mapped),
    };
}

export function mapAdminSiteComponentListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        components: raw.map(mapAdminSiteComponent),
        raw: response,
    };
}

export function mapAdminSiteComponentDetailResponse(response = {}) {
    return mapAdminSiteComponent(response.data || {});
}

export function mapAdminUploadResponse(response = {}) {
    const data = response.data || {};

    return {
        path: data.path || '',
        url: data.url || data.path || '',
        storagePath: data.storage_path || '',
        filename: data.filename || '',
        mimeType: data.mime_type || '',
        size: toNumber(data.size),
        raw: response,
    };
}
