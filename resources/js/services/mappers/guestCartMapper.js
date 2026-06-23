function toNumber(value) {
    return Number(value || 0);
}

function toSafeQuantity(value) {
    const quantity = Number(value || 1);

    if (Number.isNaN(quantity) || quantity < 1) {
        return 1;
    }

    return quantity;
}

function getVariantId(variant = {}, fallbackId = null) {
    return variant.id ?? variant.product_variant_id ?? variant.productVariantId ?? fallbackId;
}

function getProductId(product = {}, variant = {}) {
    return product.id ?? product.productId ?? variant.product_id ?? variant.productId ?? null;
}

function getAvailableStock(product = {}, variant = {}) {
    return toNumber(
        variant.available_stock ??
            variant.availableStock ??
            variant.stock ??
            product.available_stock ??
            product.availableStock ??
            product.stock ??
            0,
    );
}

function getPrice(product = {}, variant = {}) {
    return toNumber(
        variant.price ??
            variant.sale_price ??
            variant.salePrice ??
            product.priceMin ??
            product.min_price ??
            product.price ??
            0,
    );
}

function getImageFromArray(images) {
    if (!Array.isArray(images) || images.length === 0) {
        return '';
    }

    const firstImage = images[0];

    if (typeof firstImage === 'string') {
        return firstImage;
    }

    return firstImage.url || firstImage.image || firstImage.thumbnail || '';
}

function getProductImage(product = {}, variant = {}) {
    return (
        variant.thumbnail ||
        variant.image ||
        variant.imageUrl ||
        product.thumbnail ||
        product.image ||
        product.imageUrl ||
        getImageFromArray(product.images) ||
        getImageFromArray(product.gallery) ||
        ''
    );
}

export function makeGuestCartItem(productVariantId, quantity = 1, meta = {}) {
    const product = meta.product || {};
    const variant = meta.variant || meta.selectedVariant || {};

    const finalVariantId = getVariantId(variant, productVariantId);
    const price = getPrice(product, variant);
    const availableStock = getAvailableStock(product, variant);
    const safeQuantity = toSafeQuantity(quantity);

    return {
        cartItemId: `guest-${finalVariantId}`,

        productId: getProductId(product, variant),
        productVariantId: finalVariantId,

        slug: product.slug || '',

        name: product.name || product.product_name || '',
        image: getProductImage(product, variant),

        price,
        quantity: safeQuantity,

        size: variant.size || '',
        color: variant.color || '',

        stock: availableStock,
        availableStock,
        inStock: availableStock,

        selected: true,
        total: price * safeQuantity,

        isGuest: true,

        raw: {
            product,
            variant,
        },
    };
}

export function normalizeGuestCartItems(items = []) {
    return items
        .filter((item) => item && item.productVariantId)
        .map((item) => {
            const quantity = toSafeQuantity(item.quantity);
            const price = toNumber(item.price);
            const availableStock = toNumber(item.availableStock ?? item.available_stock ?? item.stock ?? 0);

            return {
                ...item,

                cartItemId: item.cartItemId || `guest-${item.productVariantId}`,

                price,
                quantity,

                stock: availableStock,
                availableStock,
                inStock: availableStock,

                selected: item.selected ?? true,
                total: price * quantity,

                isGuest: true,
            };
        });
}

export function mapGuestCartResponse(items = []) {
    const normalizedItems = normalizeGuestCartItems(items);

    const totalItems = normalizedItems.reduce((sum, item) => {
        return sum + toNumber(item.quantity);
    }, 0);

    const subTotal = normalizedItems.reduce((sum, item) => {
        return sum + toNumber(item.total);
    }, 0);

    return {
        success: true,

        items: normalizedItems,

        itemCount: totalItems,
        totalItems,

        subTotal,
        shipping: 0,
        discount: 0,
        grandTotal: subTotal,

        raw: {
            items: normalizedItems,
            item_count: totalItems,
            sub_total: subTotal,
            shipping: 0,
            discount: 0,
            grand_total: subTotal,
        },
    };
}

export function mapGuestCartActionResponse({ success = true, message = '', warning = '', items = [] } = {}) {
    return {
        success: Boolean(success),
        message,
        warning,
        data: null,
        cart: mapGuestCartResponse(items),
        raw: {
            success,
            message,
            warning,
            items,
        },
    };
}

export function limitQuantityByStock(quantity, availableStock) {
    const safeQuantity = toSafeQuantity(quantity);
    const stock = toNumber(availableStock);

    if (stock > 0 && safeQuantity > stock) {
        return stock;
    }

    return safeQuantity;
}

export function toGuestQuantity(value) {
    return toSafeQuantity(value);
}

export function toGuestNumber(value) {
    return toNumber(value);
}
