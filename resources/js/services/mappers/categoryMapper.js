function toNumber(value) {
    return Number(value || 0);
}

function normalizeImage(url) {
    if (!url) return '/images/no-image.png';

    const value = String(url).trim();

    if (!value) return '/images/no-image.png';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

/**
 * GET /api/categories
 *
 * BE trả:
 * id, name, parent_id, products_count
 */
export function mapCategory(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        parentId: item.parent_id,
        productsCount: toNumber(item.products_count),
        raw: item,
    };
}

/**
 * GET /api/categories/tree
 *
 * BE trả:
 * id, name, children
 */
export function mapCategoryTreeItem(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        children: Array.isArray(item.children) ? item.children.map(mapCategoryTreeItem) : [],
        raw: item,
    };
}

/**
 * GET /api/categories/{id}
 *
 * BE trả:
 * id, name, parent, children
 */
export function mapCategoryDetail(item = {}) {
    return {
        id: item.id,
        name: item.name || '',

        parent: item.parent
            ? {
                  id: item.parent.id,
                  name: item.parent.name || '',
                  slug: item.parent.slug || '',
                  icon: item.parent.icon || '',
                  image: normalizeImage(item.parent.image),
                  thumbnail: normalizeImage(item.parent.thumbnail),
                  parentId: item.parent.parent_id,
                  raw: item.parent,
              }
            : null,

        children: Array.isArray(item.children) ? item.children.map(mapCategoryChild) : [],

        raw: item,
    };
}

function mapCategoryChild(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',
        icon: item.icon || '',
        image: normalizeImage(item.image),
        thumbnail: normalizeImage(item.thumbnail),
        parentId: item.parent_id,
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        deletedAt: item.deleted_at || null,
        raw: item,
    };
}

/**
 * GET /api/categories/{id}/products
 *
 * BE trả product:
 * id, name, thumbnail, average_rating, total_reviews
 */
export function mapCategoryProduct(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        thumbnail: normalizeImage(item.thumbnail),
        image: normalizeImage(item.thumbnail),
        averageRating: toNumber(item.average_rating),
        rating: toNumber(item.average_rating),
        totalReviews: toNumber(item.total_reviews),
        reviews: toNumber(item.total_reviews),
        raw: item,
    };
}

export function mapCategoryListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        categories: raw.map(mapCategory),
        raw: response,
    };
}

export function mapCategoryTreeResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        categories: raw.map(mapCategoryTreeItem),
        raw: response,
    };
}

export function mapCategoryDetailResponse(response = {}) {
    return mapCategoryDetail(response.data || {});
}

export function mapCategoryProductsResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',

        category: response.category
            ? {
                  id: response.category.id,
                  name: response.category.name || '',
                  raw: response.category,
              }
            : null,

        products: raw.map(mapCategoryProduct),

        meta: {
            currentPage: toNumber(response.meta?.current_page),
            lastPage: toNumber(response.meta?.last_page),
            perPage: toNumber(response.meta?.per_page),
            total: toNumber(response.meta?.total),
        },

        raw: response,
    };
}
