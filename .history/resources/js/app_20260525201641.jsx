import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import OrderSuccess from './pages/OrderSuccess';
import ProductDetail from './pages/ProductDetail';
import Shop from './pages/Shop';

import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Register from './pages/Register';

import '../css/app.css';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import CampaignRegistrationSuccess from './pages/CampaignRegistrationSuccess';
import AccountProfile from './pages/account/AccountProfile';
import MyTransactions from './pages/account/AccountTransactions';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import AccountLayout from './pages/account/AccountLayout';
import AccountOrders from './pages/account/AccountOrders';
import AccountOrderDetail from './pages/account/AccountOrderDetail';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ResetPassword from './pages/ResetPassword';
import AccountAddress from './pages/account/AccountAddress';
import AccountNotifications from './pages/account/AccountNotification';
import AccountCampaign from './pages/account/AccountCampaign';
import AccountCampaignDetail from './pages/account/AccountCampaignDetail';
import AccountOverview from './pages/account/AccountOverview';

createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/shop" element={<Shop />} />
                            <Route path="/product/:slug" element={<ProductDetail />} />


                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route
                                path="/cart"
                                element={
                                    <ProtectedRoute>
                                        <Cart />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/checkout"
                                element={
                                    <ProtectedRoute>
                                        <Checkout />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/order-success/:orderId"
                                element={
                                    <ProtectedRoute>
                                        <OrderSuccess />
                                    </ProtectedRoute>
                                }
                            />

                            <Route path="/campaigns" element={<Campaigns />} />
                            <Route path="/campaigns/:id" element={<CampaignDetail />} />
                            <Route
                                path="/campaigns/:id/registration-success"
                                element={<CampaignRegistrationSuccess />}
                            />

                            <Route
                                path="/account"
                                element={
                                    <ProtectedRoute>
                                        <AccountLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<AccountOverview />} />
                                <Route path="profile" element={<AccountProfile />} />
                                <Route path="orders" element={<AccountOrders />} />
                                <Route path="orders/:id" element={<AccountOrderDetail />} />
                                <Route path="transactions" element={<MyTransactions />} />
                                <Route path="addresses" element={<AccountAddress />} />
                                <Route path="notifications" element={<AccountNotifications />} />
                                <Route path="campaigns" element={<AccountCampaign />} />
                                <Route path="campaigns/:id" element={<AccountCampaignDetail />} />
                            </Route>
                        </Routes>
                        <ToastContainer
                            position="bottom-left"
                            autoClose={2500}
                            hideProgressBar={false}
                            newestOnTop
                            closeOnClick
                            pauseOnHover
                            draggable
                            theme="colored"
                        />
                    </CartProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
