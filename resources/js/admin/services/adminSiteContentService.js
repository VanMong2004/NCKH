import api from '../../services/api';

import {
    mapAdminSiteComponentDetailResponse,
    mapAdminSiteComponentListResponse,
    mapAdminUploadResponse,
} from '../mappers/adminSiteContentMapper';

const adminSiteContentService = {
    async getComponents(params = {}) {
        const res = await api.get('/admin/site-components', { params });
        return mapAdminSiteComponentListResponse(res.data);
    },

    async getComponent(id) {
        const res = await api.get(`/admin/site-components/${id}`);
        return mapAdminSiteComponentDetailResponse(res.data);
    },

    async createComponent(payload) {
        const res = await api.post('/admin/site-components', normalizeComponentPayload(payload));
        return mapAdminSiteComponentDetailResponse(res.data);
    },

    async updateComponent(id, payload) {
        const res = await api.put(`/admin/site-components/${id}`, normalizeComponentPayload(payload));
        return mapAdminSiteComponentDetailResponse(res.data);
    },

    async deleteComponent(id) {
        const res = await api.delete(`/admin/site-components/${id}`);
        return res.data;
    },

    async toggleComponent(id) {
        const res = await api.patch(`/admin/site-components/${id}/toggle`);
        return mapAdminSiteComponentDetailResponse(res.data);
    },

    async createItem(componentId, payload) {
        const res = await api.post(`/admin/site-components/${componentId}/items`, normalizeItemPayload(payload));
        return res.data;
    },

    async updateItem(itemId, payload) {
        const res = await api.put(`/admin/site-component-items/${itemId}`, normalizeItemPayload(payload));
        return res.data;
    },

    async deleteItem(itemId) {
        const res = await api.delete(`/admin/site-component-items/${itemId}`);
        return res.data;
    },

    async toggleItem(itemId) {
        const res = await api.patch(`/admin/site-component-items/${itemId}/toggle`);
        return res.data;
    },

    async reorderItems(componentId, items = []) {
        const res = await api.patch(`/admin/site-components/${componentId}/items/reorder`, {
            items: items.map((item, index) => ({
                id: item.id,
                sort_order: Number(item.sort_order ?? item.sortOrder ?? index + 1),
            })),
        });

        return mapAdminSiteComponentDetailResponse(res.data);
    },

    async uploadImage(file, folder = 'site-content') {
        if (!file) {
            throw new Error('Chưa chọn ảnh');
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', folder);

        const res = await api.post('/admin/uploads/image', formData, {
            headers: {
                'Content-Type': undefined,
            },
            transformRequest: [(data) => data],
        });

        return mapAdminUploadResponse(res.data);
    },
};

function emptyToNull(value) {
    if (value === '' || value === undefined || value === null) return null;
    return value;
}

function normalizeBoolean(value) {
    return value === true || value === 1 || value === '1';
}

function normalizeObject(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }

    return {};
}

function normalizeComponentPayload(payload = {}) {
    return {
        page_key: payload.page_key || '',
        page_name: payload.page_name || '',
        component_key: payload.component_key || '',
        component_name: payload.component_name || '',
        component_type: payload.component_type || 'section',

        title: emptyToNull(payload.title),
        subtitle: emptyToNull(payload.subtitle),
        content: emptyToNull(payload.content),

        image: emptyToNull(payload.image),
        mobile_image: emptyToNull(payload.mobile_image),

        payload: normalizeObject(payload.payload),

        sort_order: Number(payload.sort_order || 0),
        is_active: normalizeBoolean(payload.is_active),
    };
}

function normalizeItemPayload(payload = {}) {
    return {
        parent_id: payload.parent_id ? Number(payload.parent_id) : null,

        group_key: emptyToNull(payload.group_key),
        item_key: emptyToNull(payload.item_key),
        item_type: payload.item_type || 'link',

        label: emptyToNull(payload.label),
        title: emptyToNull(payload.title),
        subtitle: emptyToNull(payload.subtitle),
        content: emptyToNull(payload.content),

        icon_key: emptyToNull(payload.icon_key),

        image: emptyToNull(payload.image),
        mobile_image: emptyToNull(payload.mobile_image),

        link_text: emptyToNull(payload.link_text),
        link_url: emptyToNull(payload.link_url),
        target: payload.target || '_self',

        payload: normalizeObject(payload.payload),

        sort_order: Number(payload.sort_order || 0),
        is_active: normalizeBoolean(payload.is_active),
    };
}

export default adminSiteContentService;
