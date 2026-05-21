import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

import cartService from '../services/cartService';
import { useAuth } from './AuthContext';
import { mapCartResponse } from '../services/mappers/cartMapper';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    async function fetchCart() {
        if (!user) return;

        try {
            const response = await cartService.getCart();
            const mappedCart = mapCartResponse(response);

            setCartItems(mappedCart.items);
            setTotalPrice(mappedCart.grandTotal);
            setTotalItems(mappedCart.totalItems);
        } catch (error) {
            console.error('Lỗi fetchCart:', error);

            if (error?.status !== 401) {
                toast.error(error?.message || 'Không thể tải giỏ hàng');
            }
        }
    }

    useEffect(() => {
        if (!user) {
            setCartItems([]);
            setTotalPrice(0);
            setTotalItems(0);
            return;
        }

        fetchCart();
    }, [user]);

    async function addToCartByVariant(productVariantId, quantity = 1) {
        if (!user) {
            navigate('/login', {
                state: { from: location.pathname },
            });
            return false;
        }

        try {
            const response = await cartService.addToCart({
                product_variant_id: productVariantId,
                quantity,
            });

            await fetchCart();

            if (response.warning) {
                toast.warn(response.warning);
            } else {
                toast.success(response.message || 'Đã thêm sản phẩm vào giỏ hàng');
            }

            return true;
        } catch (error) {
            console.error('Lỗi addToCartByVariant:', error);
            toast.error(error?.message || 'Không thể thêm vào giỏ hàng');
            return false;
        }
    }

    async function addToCart(product, size = null, quantity = 1) {
        const variants = product?.variants || [];
        let selectedVariant = null;

        if (variants.length === 1) {
            selectedVariant = variants[0];
        } else if (size) {
            selectedVariant = variants.find((variant) => variant.size === size);
        }

        if (!selectedVariant) {
            toast.warn('Vui lòng chọn phân loại sản phẩm');
            return false;
        }

        return addToCartByVariant(selectedVariant.id, quantity);
    }

    async function quantityChange(cartItemId, newQuantity) {
        try {
            const response = await cartService.updateItem(cartItemId, newQuantity);

            await fetchCart();

            if (response.warning) {
                toast.warn(response.warning);
            } else {
                toast.success(response.message || 'Đã cập nhật số lượng');
            }
        } catch (error) {
            console.error('Lỗi quantityChange:', error);
            toast.error(error?.message || 'Không thể cập nhật số lượng');
        }
    }

    async function removeCart(cartItemId) {
        try {
            const response = await cartService.removeItem(cartItemId);

            await fetchCart();

            toast.success(response.message || 'Đã xóa sản phẩm khỏi giỏ');
        } catch (error) {
            console.error('Lỗi removeCart:', error);
            toast.error(error?.message || 'Không thể xóa sản phẩm');
        }
    }

    async function clearCart() {
        try {
            for (const item of cartItems) {
                await cartService.removeItem(item.cartItemId);
            }

            await fetchCart();
            toast.success('Đã xóa toàn bộ giỏ hàng');
        } catch (error) {
            console.error('Lỗi clearCart:', error);
            toast.error(error?.message || 'Không thể xóa toàn bộ giỏ hàng');
        }
    }

    return (
        <CartContext.Provider
            value={{
                cartItems,
                setCartItems,
                totalPrice,
                totalItems,
                fetchCart,
                addToCart,
                addToCartByVariant,
                quantityChange,
                removeCart,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
