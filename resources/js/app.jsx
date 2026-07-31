import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from 'react-toastify';

import './bootstrap';
import '../css/app.css';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';

import ProtectedRoute from './components/ui/ProtectedRoute';
import AdminPromotionDetail from './admin/pages/AdminPromotionDetail';
import siteAnalyticsService from './services/siteAnalyticsService';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const MockPaymentQr = lazy(() => import('./pages/MockPaymentQr'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));

const Promotions = lazy(() => import('./pages/Promotions'));
const PromotionDetail = lazy(() => import('./pages/PromotionDetail'));

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const Policy = lazy(() => import('./pages/Policy'));
const Contact = lazy(() => import('./pages/Contact'));

const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const AccountOverview = lazy(() => import('./pages/account/AccountOverview'));
const AccountProfile = lazy(() => import('./pages/account/AccountProfile'));
const AccountOrders = lazy(() => import('./pages/account/AccountOrders'));
const AccountOrderDetail = lazy(() => import('./pages/account/AccountOrderDetail'));
const AccountAddress = lazy(() => import('./pages/account/AccountAddress'));
const AccountNotifications = lazy(() => import('./pages/account/AccountNotification'));
const MyTransactions = lazy(() => import('./pages/account/AccountTransactions'));

const AdminRoute = lazy(() => import('./components/ui/AdminRoute'));
const AdminLayout = lazy(() => import('./admin/layout/AdminLayout'));

const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminProducts = lazy(() => import('./admin/pages/AdminProducts'));
const AdminPromotions = lazy(() => import('./admin/pages/AdminPromotions'));
const AdminOrders = lazy(() => import('./admin/pages/AdminOrders'));
const AdminUsers = lazy(() => import('./admin/pages/AdminUsers'));
const AdminReviews = lazy(() => import('./admin/pages/AdminReviews'));
const AdminSiteContent = lazy(() => import('./admin/pages/AdminSiteContent'));
const AdminAnalytics = lazy(() => import('./admin/pages/AdminAnalytics'));
const AdminChatKnowledge = lazy(() => import('./admin/pages/AdminChatKnowledge'));
const AdminChatConversations = lazy(() => import('./admin/pages/AdminChatConversations'));
const AdminContacts = lazy(() => import('./admin/pages/AdminContacts'));
const AdminCatalogManagement = lazy(() => import('./admin/pages/AdminCatalogManagement'));

function PageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
            <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Loader2 size={30} className="mx-auto animate-spin text-blue-700 dark:text-blue-300" />

                <p className="mt-3 text-sm font-bold text-blue-950 dark:text-white">Đang tải trang...</p>
            </div>
        </div>
    );
}

function AnalyticsRouteTracker() {
    const location = useLocation();

    React.useEffect(() => {
        if (location.pathname.startsWith('/admin')) return;

        siteAnalyticsService.trackPageView(location.pathname);
    }, [location.pathname]);

    return null;
}

createRoot(document.getElementById('app')).render(
    <BrowserRouter>
        <AnalyticsRouteTracker />
        <ThemeProvider>
            <AuthProvider>
                <CartProvider>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/shop" element={<Shop />} />
                            <Route path="/product/:slug" element={<ProductDetail />} />
                            <Route path="/cart" element={<Cart />} />

                            <Route path="/promotions" element={<Promotions />} />
                            <Route path="/promotions/:slug" element={<PromotionDetail />} />

                            <Route path="/blog" element={<Blog />} />
                            <Route path="/blog/:slug" element={<BlogDetail />} />
                            <Route path="/policy" element={<Policy />} />
                            <Route path="/contact" element={<Contact />} />

                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />

                            <Route
                                path="/checkout"
                                element={
                                    // <ProtectedRoute>
                                        <Checkout />
                                    // </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/order-success/:orderId"
                                element={
                                    // <ProtectedRoute>
                                        <OrderSuccess />
                                    // </ProtectedRoute>
                                }
                            />
                            <Route path="/order-success" element={<OrderSuccess />} />

                            <Route path="/payment/qr" element={<MockPaymentQr />} />

                            <Route
                                path="/payment/result"
                                element={
                                    // <ProtectedRoute>
                                        <PaymentResult />
                                    // </ProtectedRoute>
                                }
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
                                <Route path="overview" element={<AccountOverview />} />
                                <Route path="profile" element={<AccountProfile />} />
                                <Route path="orders" element={<AccountOrders />} />
                                <Route path="orders/:id" element={<AccountOrderDetail />} />
                                <Route path="transactions" element={<MyTransactions />} />
                                <Route path="addresses" element={<AccountAddress />} />
                                <Route path="notifications" element={<AccountNotifications />} />
                            </Route>

                            <Route
                                path="/admin"
                                element={
                                    <AdminRoute>
                                        <AdminLayout />
                                    </AdminRoute>
                                }
                            >
                                <Route index element={<AdminDashboard />} />
                                <Route path="dashboard" element={<AdminDashboard />} />

                                <Route path="products" element={<AdminProducts />} />
                                <Route path="catalogs" element={<AdminCatalogManagement />} />
                                <Route path="promotions" element={<AdminPromotions />} />
                                <Route path="promotions/:id" element={<AdminPromotionDetail />} />
                                <Route path="orders" element={<AdminOrders />} />
                                <Route path="users" element={<AdminUsers />} />
                                <Route path="contacts" element={<AdminContacts />} />
                                <Route path="reviews" element={<AdminReviews />} />
                                <Route path="site-content" element={<AdminSiteContent />} />
                                <Route path="chat-knowledge" element={<AdminChatKnowledge />} />
                                <Route path="chat-conversations" element={<AdminChatConversations />} />
                                <Route path="analytics" element={<AdminAnalytics />} />
                            </Route>
                        </Routes>
                    </Suspense>

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
    </BrowserRouter>,
);
