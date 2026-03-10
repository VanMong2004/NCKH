import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    // Load cart từ localStorage khi khởi động
    useEffect(() => {
        const savedCart = localStorage.getItem('shopping_cart');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    // Lưu cart vào localStorage khi thay đổi
    useEffect(() => {
        localStorage.setItem('shopping_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Thêm sản phẩm vào giỏ
    const addToCart = (product, size, quantity = 1) => {

        if (product.hasSize && !size) {
            toast.warn('Vui lòng chọn size');
            return;
        }

        const cartItemId = product.hasSize ? `${product.id}-${size}` : `${product.id}`; // Tiền đề cho việc xử lý khi sản phẩm không có size

        const cartItem = {
            cartItemId, // id giỏ hàng
            id: product.id,
            name: product.name,
            image: product.image[0],
            price: product.price,
            color: product.color,
            inStock: product.inStock,
            size: product.hasSize ? size : null,
            quantity,
        };

        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);

            if (existingItem) {
                toast.info('Đã tăng số lượng sản phẩm trong giỏ');
                return prevItems.map((item) =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item,
                );
            }
            toast.success('Đã thêm sản phẩm vào giỏ');
            return [...prevItems, cartItem];
        });
    };

    // Thay đổi số lượng
    const quantityChange = (cartItemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeCart(cartItemId);
            return;
        }

        setCartItems((prevItems) =>
            prevItems.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item)),
        );
    };

    // Xóa sản phẩm khỏi giỏ
    const removeCart = (cartItemId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
        toast.warn('Đã xóa sản phẩm khỏi giỏ');
    };

    // Clear toàn bộ giỏ hàng
    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('shopping_cart');
    };

    // Tổng tiền
    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    // Tổng số lượng
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

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
