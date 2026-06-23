function toNumber(value) {
    return Number(value || 0);
}

/**
 * GET /api/cart
 *
 * BE item trả cả dữ liệu cũ và dữ liệu promotion mới:
 * cart_item_id, product_id, product_variant_id, slug,
 * product_name, thumbnail, price, quantity,
 * size, color, stock, available_stock, selected, total,
 * original_price, discount_amount, final_price,
 * promotion_price, promotion, has_promotion,
 * promotion_login_required, original_total, discount_total
 */
export function mapCartItem(item = {}) {
    return {
        cartItemId: item.cart_item_id,

        productId: item.product_id,
        productVariantId: item.product_variant_id,

        slug: item.slug || '',

        name: item.product_name || '',
        image: item.thumbnail || '',

        // Giữ key price để Cart.jsx / CartItem.jsx cũ vẫn chạy.
        // BE hiện đang set price = final_price.
        price: toNumber(item.price),

        quantity: toNumber(item.quantity),

        size: item.size || '',
        color: item.color || '',
        attributes: item.attributes || {},

        stock: toNumber(item.stock),
        availableStock: toNumber(item.available_stock),

        // Giữ key inStock vì Cart.jsx / CartItem.jsx đang dùng item.inStock.
        inStock: toNumber(item.available_stock),

        selected: Boolean(item.selected),

        total: toNumber(item.total),

        // Giá promotion mới
        originalPrice: toNumber(item.original_price),
        discountAmount: toNumber(item.discount_amount),
        finalPrice: toNumber(item.final_price),
        promotionPrice:
            item.promotion_price === null || item.promotion_price === undefined ? null : toNumber(item.promotion_price),

        promotion: item.promotion || null,
        hasPromotion: Boolean(item.has_promotion),
        promotionLoginRequired: Boolean(item.promotion_login_required),

        originalTotal: toNumber(item.original_total),
        discountTotal: toNumber(item.discount_total),

        raw: item,
    };
}

/**
 * GET /api/cart
 */
export function mapCartResponse(response = {}) {
    const cart = response.data || {};

    const items = Array.isArray(cart.items) ? cart.items.map(mapCartItem) : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',

        items,

        itemCount: toNumber(cart.item_count),
        totalItems: toNumber(cart.item_count),

        subTotal: toNumber(cart.sub_total),
        shipping: toNumber(cart.shipping),
        discount: toNumber(cart.discount),
        grandTotal: toNumber(cart.grand_total),

        hasLoginRequiredPromotion: Boolean(cart.has_login_required_promotion),

        raw: cart,
    };
}

/**
 * POST /api/cart
 * PUT /api/cart/{id}
 * DELETE /api/cart/{id}
 */
export function mapCartActionResponse(response = {}) {
    return {
        success: Boolean(response.success),
        message: response.message || '',
        warning: response.warning || '',
        data: response.data || null,
        raw: response,
    };
}
