export function mapCartItem(item = {}) {
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);

    return {
        cartItemId: item.cart_item_id,

        productVariantId: item.product_variant_id,

        name: item.product_name || 'Sản phẩm',

        image: item.thumbnail || '/images/no-image.png',

        slug: item.slug || '',

        size: item.size || '',

        color: item.color || '',

        price,

        quantity,

        total: Number(item.total || price * quantity),

        inStock: Number(item.available_stock || item.stock || 0),

        selected: Boolean(item.selected),

        raw: item,
    };
}

export function mapCartResponse(response = {}) {
    const cart = response.data || response.cart || response;

    const items = (cart.items || []).map(mapCartItem);

    return {
        id: cart.id,

        items,

        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),

        grandTotal: Number(cart.total || items.reduce((sum, item) => sum + item.total, 0)),
    };
}
