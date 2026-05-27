function toNumber(value) {
    return Number(value || 0);
}

/**
 * GET /api/cart
 * BE item trả:
 * cart_item_id, product_id, product_variant_id, slug,
 * product_name, thumbnail, price, quantity,
 * size, color, stock, available_stock, selected, total
 */
export function mapCartItem(item) {
    return {
        cartItemId: item.cart_item_id,

        productId: item.product_id,

        productVariantId: item.product_variant_id,

        slug: item.slug,

        name: item.product_name,

        image: item.thumbnail,

        price: toNumber(item.price),

        quantity: toNumber(item.quantity),

        size: item.size,

        color: item.color,

        stock: toNumber(item.stock),

        availableStock: toNumber(item.available_stock),

        selected: Boolean(item.selected),

        total: toNumber(item.total),

        raw: item,
    };
}

/**
 * GET /api/cart
 * BE response trả:
 * success
 * data.items
 * data.item_count
 * data.sub_total
 * data.shipping
 * data.discount
 * data.grand_total
 */
export function mapCartResponse(response) {
    const cart = response.data;

    return {
        success: Boolean(response.success),

        items: Array.isArray(cart.items) ? cart.items.map(mapCartItem) : [],

        itemCount: toNumber(cart.item_count),

        totalItems: toNumber(cart.item_count),

        subTotal: toNumber(cart.sub_total),

        shipping: toNumber(cart.shipping),

        discount: toNumber(cart.discount),

        grandTotal: toNumber(cart.grand_total),

        raw: cart,
    };
}