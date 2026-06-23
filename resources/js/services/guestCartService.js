import {
    limitQuantityByStock,
    makeGuestCartItem,
    mapGuestCartActionResponse,
    mapGuestCartResponse,
    normalizeGuestCartItems,
    toGuestNumber,
    toGuestQuantity,
} from './mappers/guestCartMapper';

const GUEST_CART_KEY = 'ctut_guest_cart';

function readRawGuestItems() {
    try {
        const value = localStorage.getItem(GUEST_CART_KEY);

        if (!value) {
            return [];
        }

        const items = JSON.parse(value);

        return Array.isArray(items) ? items : [];
    } catch (error) {
        console.error('readRawGuestItems', error);
        return [];
    }
}

function writeRawGuestItems(items = []) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

const guestCartService = {
    getCart() {
        const items = readRawGuestItems();

        return mapGuestCartResponse(items);
    },

    getItems() {
        return normalizeGuestCartItems(readRawGuestItems());
    },

    hasItems() {
        return this.getItems().length > 0;
    },

    addToCart(productVariantId, quantity = 1, meta = {}) {
        const newItem = makeGuestCartItem(productVariantId, quantity, meta);

        if (!newItem.productVariantId) {
            const currentItems = this.getItems();

            return mapGuestCartActionResponse({
                success: false,
                message: '',
                warning: 'Không tìm thấy phân loại sản phẩm',
                items: currentItems,
            });
        }

        const currentItems = this.getItems();

        const existedIndex = currentItems.findIndex((item) => {
            return String(item.productVariantId) === String(newItem.productVariantId);
        });

        let nextItems = [];
        let message = 'Đã thêm sản phẩm vào giỏ hàng';
        let warning = '';

        if (existedIndex >= 0) {
            nextItems = currentItems.map((item, index) => {
                if (index !== existedIndex) {
                    return item;
                }

                const requestedQuantity = toGuestQuantity(item.quantity) + toGuestQuantity(quantity);
                const finalQuantity = limitQuantityByStock(
                    requestedQuantity,
                    newItem.availableStock || item.availableStock,
                );

                if (finalQuantity < requestedQuantity) {
                    warning = `Chỉ còn ${finalQuantity} sản phẩm`;
                } else {
                    message = 'Đã cập nhật số lượng trong giỏ hàng';
                }

                return {
                    ...item,
                    ...newItem,

                    quantity: finalQuantity,
                    total: toGuestNumber(newItem.price) * finalQuantity,
                };
            });
        } else {
            const requestedQuantity = toGuestQuantity(quantity);
            const finalQuantity = limitQuantityByStock(requestedQuantity, newItem.availableStock);

            if (finalQuantity < requestedQuantity) {
                warning = `Chỉ còn ${finalQuantity} sản phẩm`;
            }

            nextItems = [
                ...currentItems,
                {
                    ...newItem,

                    quantity: finalQuantity,
                    total: toGuestNumber(newItem.price) * finalQuantity,
                },
            ];
        }

        writeRawGuestItems(nextItems);

        return mapGuestCartActionResponse({
            success: true,
            message,
            warning,
            items: nextItems,
        });
    },

    updateItem(cartItemId, quantity = 1) {
        const currentItems = this.getItems();

        let found = false;
        let warning = '';

        const nextItems = currentItems.map((item) => {
            if (String(item.cartItemId) !== String(cartItemId)) {
                return item;
            }

            found = true;

            const requestedQuantity = toGuestQuantity(quantity);
            const finalQuantity = limitQuantityByStock(requestedQuantity, item.availableStock || item.stock);

            if (finalQuantity < requestedQuantity) {
                warning = `Chỉ còn ${finalQuantity} sản phẩm`;
            }

            return {
                ...item,

                quantity: finalQuantity,
                total: toGuestNumber(item.price) * finalQuantity,
            };
        });

        writeRawGuestItems(nextItems);

        return mapGuestCartActionResponse({
            success: found,
            message: found ? 'Đã cập nhật số lượng' : '',
            warning: found ? warning : 'Không tìm thấy sản phẩm trong giỏ hàng',
            items: nextItems,
        });
    },

    removeItem(cartItemId) {
        const currentItems = this.getItems();

        const nextItems = currentItems.filter((item) => {
            return String(item.cartItemId) !== String(cartItemId);
        });

        writeRawGuestItems(nextItems);

        return mapGuestCartActionResponse({
            success: true,
            message: 'Đã xóa sản phẩm khỏi giỏ',
            warning: '',
            items: nextItems,
        });
    },

    clearCart() {
        writeRawGuestItems([]);

        return mapGuestCartActionResponse({
            success: true,
            message: 'Đã xóa toàn bộ giỏ hàng',
            warning: '',
            items: [],
        });
    },

    removeStorage() {
        localStorage.removeItem(GUEST_CART_KEY);
    },
};

export default guestCartService;
