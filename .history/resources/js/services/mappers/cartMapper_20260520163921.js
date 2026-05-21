export function mapCartItem(item = {}) {
    const variant = item.product_variant || item.variant || {};

    const product = variant.product || item.product || {};

    const price = Number(item.price || variant.price || product.price || 0);

    const quantity = Number(item.quantity || 0);

    return {
        // 🔥 khớp BE
        cartItemId: item.cart_item_id || item.id,

        productVariantId: item.product_variant_id || variant.id,

        productId: item.product_id || product.id,

        name: item.product_name || product.name || item.name || 'Sản phẩm',

        slug: item.slug || product.slug || '',

        image: item.thumbnail || product.thumbnail || product.image || item.image || '/images/no-image.png',

        size: item.size || variant.size || '',

        color: item.color || variant.color || '',

        price,

        quantity,

        total: Number(item.total || price * quantity),

        inStock: Number(item.available_stock ?? variant.available_stock ?? item.stock ?? variant.stock ?? 0),

        selected: Boolean(item.selected),

        raw: item,
    };
}

export function mapCartResponse(response = {}) {
    const cart = response.data || response.cart || response;

    const rawItems = cart.items || cart.cart_items || [];

    const items = rawItems.map(mapCartItem);

    return {
        id: cart.id,

        items,

        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),

        grandTotal: Number(cart.grand_total || cart.total || items.reduce((sum, item) => sum + item.total, 0)),

        raw: cart,
    };
}
