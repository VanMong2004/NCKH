import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '../css/app.css';
import Home from './pages/Home';
import MainLayout from './layout/MainLayout';
import AuthLayout from './layout/AuthLayout';
import ProductDetail from './pages/ProductDetail';
import ProductsPage from './pages/Products';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import AccountPage from './pages/Account';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import OrderDetail from './pages/OrderDetail';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CategoryPage from './pages/Categories';
function App() {
    return (
        <>
            <BrowserRouter>
                <AuthProvider>
                    <ThemeProvider>
                        <CartProvider>
                            <Routes>
                                <Route path="/" element={<MainLayout />}>
                                    <Route index element={<Home />} />
                                    <Route path="sanpham/:id" element={<ProductDetail />} />
                                    <Route path="sanpham" element={<ProductsPage />} />
                                    <Route path="danhmuc" element={<CategoryPage />} />
                                    <Route
                                        path="giohang"
                                        element={
                                            <ProtectedRoute>
                                                <CartPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="donhang/:id"
                                        element={
                                            <ProtectedRoute>
                                                <OrderDetail />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="thanhtoan"
                                        element={
                                            <ProtectedRoute>
                                                <CheckoutPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="taikhoan"
                                        element={
                                            <ProtectedRoute>
                                                <AccountPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                </Route>
                                <Route path="/auth" element={<AuthLayout />}>
                                    <Route path="dangnhap" element={<LoginPage />} />
                                    <Route path="dangky" element={<RegisterPage />} />
                                    <Route path="quenmatkhau" element={<ForgotPasswordPage />} />
                                </Route>
                            </Routes>
                        </CartProvider>
                    </ThemeProvider>
                </AuthProvider>
            </BrowserRouter>
            <ToastContainer
                position="bottom-left"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                pauseOnHover
                theme="colored"
            />
        </>
    );
}

createRoot(document.getElementById('app')).render(<App />);
