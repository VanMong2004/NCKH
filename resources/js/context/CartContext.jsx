import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';
import { useLocation, useNavigate } from 'react-router-dom'; // [SỬA] thêm useNavigate

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0); // [SỬA] tách state tổng tiền
    const [totalItems, setTotalItems] = useState(0); // [SỬA] tách state tổng số lượng

    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate(); // [SỬA] khai báo navigate

    // [SỬA] Hàm map cart từ API về format frontend đang dùng
    const normalizeCart = (cart) => {
        const items = (cart?.items || []).map((item) => ({
            cartItemId: item.id,
            id: item.product_variant?.product?.id ?? item.product_variant?.product_id ?? null,
            product_variant_id: item.product_variant_id,
            name: item.product_variant?.product?.name || 'Sản phẩm',
            image: item.product_variant?.product?.images?.[0]?.url || '',
            price: Number(item.product_variant?.price || 0),
            color: item.product_variant?.color || null,
            inStock: Number(item.product_variant?.stock || 0),
            size: item.product_variant?.size || null,
            quantity: Number(item.quantity || 0),
        }));

        return {
            items,
            totalPrice: Number(cart?.total_price || 0),
            totalItems: Number(cart?.total_quantity || 0),
        };
    };

    // [SỬA] Hàm load cart dùng lại nhiều nơi
    const fetchCart = async () => {
        try {
            const data = await cartService.getCart();

            const normalized = normalizeCart(data);

            setCartItems(normalized.items);
            setTotalPrice(normalized.totalPrice);
            setTotalItems(normalized.totalItems);
        } catch (error) {
            console.error('Lỗi fetchCart:', error);

            // [SỬA] nếu chưa đăng nhập thì không toast lỗi ầm lên
            if (error?.response?.data?.message !== 'Unauthenticated.') {
                toast.error('Không thể tải giỏ hàng');
            }
        }
    };

    // [SỬA] chỉ load cart khi đã có user
    useEffect(() => {
        if (!user) {
            setCartItems([]);
            setTotalPrice(0);
            setTotalItems(0);
            return;
        }

        fetchCart();
    }, [user]);

    // Thêm sản phẩm vào giỏ
    const addToCart = async (product, size = null, quantity = 1) => {
        if (!user) {
            navigate('/auth/dangnhap', {
                state: { from: location.pathname },
            });
            return;
        }

        try {
            const variants = product?.variants || [];
            let selectedVariant = null;

            if (variants.length === 1) {
                selectedVariant = variants[0];
            } else if (size) {
                selectedVariant = variants.find((variant) => variant.size === size);
            }

            if (!selectedVariant) {
                toast.warn('Vui lòng chọn phân loại sản phẩm');
                return;
            }

            await cartService.addToCart({
                product_variant_id: selectedVariant.id,
                quantity,
            });

            await fetchCart(); // [SỬA] không setCartItems trực tiếp từ data thô nữa

            toast.success('Đã thêm sản phẩm vào giỏ');
        } catch (error) {
            console.error('Lỗi addToCart:', error);
            toast.error(error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
        }
    };

    // [SỬA] Thay đổi số lượng theo API thật
    const quantityChange = async (cartItemId, newQuantity) => {
        try {
            await cartService.updateItem({
                item_id: cartItemId,
                quantity: newQuantity,
            });

            await fetchCart();

            if (newQuantity <= 0) {
                toast.warn('Đã xóa sản phẩm khỏi giỏ');
            }
        } catch (error) {
            console.error('Lỗi quantityChange:', error);
            toast.error(error?.response?.data?.message || 'Không thể cập nhật số lượng');
        }
    };

    // [SỬA] Xóa sản phẩm khỏi giỏ theo API thật
    const removeCart = async (cartItemId) => {
        try {
            await cartService.removeItem({
                item_id: cartItemId,
            });

            await fetchCart();

            toast.warn('Đã xóa sản phẩm khỏi giỏ');
        } catch (error) {
            console.error('Lỗi removeCart:', error);
            toast.error(error?.response?.data?.message || 'Không thể xóa sản phẩm');
        }
    };

    // [SỬA] Backend chưa có clearCart, tạm xóa từng item
    const clearCart = async () => {
        try {
            for (const item of cartItems) {
                await cartService.removeItem({
                    item_id: item.cartItemId,
                });
            }

            await fetchCart();
            toast.warn('Đã xóa toàn bộ giỏ hàng');
        } catch (error) {
            console.error('Lỗi clearCart:', error);
            toast.error(error?.response?.data?.message || 'Không thể xóa toàn bộ giỏ hàng');
        }
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                setCartItems,
                addToCart,
                removeCart,
                clearCart,
                quantityChange,
                totalPrice,
                totalItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
