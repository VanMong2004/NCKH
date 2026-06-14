import { useMemo, useState } from 'react';
import { ChevronRight, Home, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import MainLayout from '../layout/MainLayout';
import CartList from '../components/cart/CartList';
import CartSummary from '../components/cart/CartSummary';
import CartBenefits from '../components/cart/CartBenefits';

import { useCart } from '../contexts/CartContext';

export default function Cart() {
    const { cartItems, quantityChange, removeCart, clearCart, totalPrice, totalItems } = useCart();

    const [selectedIds, setSelectedIds] = useState([]);

    const selectedItems = useMemo(() => {
        return cartItems.filter((item) => selectedIds.includes(item.cartItemId));
    }, [cartItems, selectedIds]);

    const subtotal = useMemo(() => {
        return selectedItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);
    }, [selectedItems]);

    const selectedCount = useMemo(() => {
        return selectedItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
    }, [selectedItems]);

    const allSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;

    function handleSelectAll() {
        if (allSelected) {
            setSelectedIds([]);
            return;
        }

        setSelectedIds(cartItems.map((item) => item.cartItemId));
    }

    function handleToggle(cartItemId) {
        setSelectedIds((current) => {
            if (current.includes(cartItemId)) {
                return current.filter((id) => id !== cartItemId);
            }

            return [...current, cartItemId];
        });
    }

    async function handleIncrease(cartItemId) {
        const item = cartItems.find((cartItem) => cartItem.cartItemId === cartItemId);

        if (!item) return;

        if (item.quantity >= item.inStock) {
            toast.warning(`Chỉ còn ${item.inStock} sản phẩm`);
            return;
        }

        await quantityChange(cartItemId, item.quantity + 1);
    }

    async function handleDecrease(cartItemId) {
        const item = cartItems.find((cartItem) => cartItem.cartItemId === cartItemId);

        if (!item) return;

        if (item.quantity <= 1) return;

        await quantityChange(cartItemId, item.quantity - 1);
    }

    async function handleRemove(cartItemId) {
        await removeCart(cartItemId);
        setSelectedIds((current) => current.filter((id) => id !== cartItemId));
    }

    async function handleRemoveSelected() {
        const idsToRemove = selectedIds.length > 0 ? selectedIds : cartItems.map((item) => item.cartItemId);

        for (const cartItemId of idsToRemove) {
            await removeCart(cartItemId);
        }

        setSelectedIds([]);
    }

    async function handleClear() {
        await clearCart();
        setSelectedIds([]);
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-5 sm:py-6">
                <Breadcrumb />

                <section className="mb-6">
                    <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white md:text-3xl">
                        Giỏ hàng{' '}
                        <span className="text-base font-bold text-slate-500 dark:text-slate-400">
                            ({totalItems || cartItems.length} sản phẩm)
                        </span>
                    </h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Kiểm tra sản phẩm trước khi tiến hành thanh toán.
                    </p>
                </section>

                {cartItems.length === 0 ? (
                    <EmptyCart />
                ) : (
                    <>
                        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                            <CartList
                                items={cartItems}
                                selectedIds={selectedIds}
                                allSelected={allSelected}
                                onSelectAll={handleSelectAll}
                                onRemoveSelected={handleRemoveSelected}
                                onToggle={handleToggle}
                                onIncrease={handleIncrease}
                                onDecrease={handleDecrease}
                                onRemove={handleRemove}
                                onClear={handleClear}
                            />

                            <div className="space-y-4">
                                <CartSummary subtotal={subtotal} itemCount={selectedCount} selectedIds={selectedIds} />

                                <div className="hidden lg:block">
                                    <CartBenefits />
                                </div>
                            </div>
                        </section>

                        <div className="mt-6 lg:hidden">
                            <CartBenefits />
                        </div>
                    </>
                )}
            </main>
        </MainLayout>
    );
}

function EmptyCart() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                <ShoppingBag size={38} />
            </div>

            <h2 className="text-xl font-bold text-blue-950 dark:text-white">Giỏ hàng của bạn đang trống</h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Hãy quay lại cửa hàng để chọn sản phẩm phù hợp.
            </p>

            <Link
                to="/shop"
                className="mt-5 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
                Tiếp tục mua sắm
            </Link>
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <span className="text-blue-950 dark:text-blue-300">Giỏ hàng</span>
        </div>
    );
}
