import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Home, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import MainLayout from '../layout/MainLayout';
import CartList from '../components/cart/CartList';
import CartSummary from '../components/cart/CartSummary';
import CartBenefits from '../components/cart/CartBenefits';
import ConfirmDialog from '../admin/components/ui/ConfirmDialog';

import { useCart } from '../contexts/CartContext';

export default function Cart() {
    const { cartItems, quantityChange, removeCart, clearCart, totalItems } = useCart();

    const [selectedIds, setSelectedIds] = useState([]);

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
    });

    useEffect(() => {
        const validIds = cartItems.map((item) => String(item.cartItemId));

        setSelectedIds((current) => {
            return current.filter((id) => validIds.includes(String(id)));
        });
    }, [cartItems]);

    const selectedItems = useMemo(() => {
        const selectedKeys = selectedIds.map((id) => String(id));

        return cartItems.filter((item) => selectedKeys.includes(String(item.cartItemId)));
    }, [cartItems, selectedIds]);

    const originalSubtotal = useMemo(() => {
        return selectedItems.reduce((total, item) => {
            const originalPrice = Number(item.originalPrice || item.price || 0);

            return total + originalPrice * Number(item.quantity || 0);
        }, 0);
    }, [selectedItems]);

    const discountTotal = useMemo(() => {
        return selectedItems.reduce((total, item) => {
            const originalPrice = Number(item.originalPrice || item.price || 0);
            const finalPrice = Number(item.finalPrice || item.price || 0);
            const directDiscount = Number(item.discountAmount || 0);
            const discount = directDiscount > 0 ? directDiscount : Math.max(originalPrice - finalPrice, 0);

            return total + discount * Number(item.quantity || 0);
        }, 0);
    }, [selectedItems]);

    const subtotal = useMemo(() => {
        return selectedItems.reduce((total, item) => {
            const finalPrice = Number(item.finalPrice || item.price || 0);

            return total + finalPrice * Number(item.quantity || 0);
        }, 0);
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

        setSelectedIds(cartItems.map((item) => String(item.cartItemId)));
    }

    function handleToggle(cartItemId) {
        const key = String(cartItemId);

        setSelectedIds((current) => {
            if (current.map(String).includes(key)) {
                return current.filter((id) => String(id) !== key);
            }

            return [...current, key];
        });
    }

    async function handleIncrease(cartItemId) {
        const item = findCartItem(cartItemId);

        if (!item) return;

        const availableStock = Number(item.availableStock ?? item.inStock ?? 0);

        if (availableStock <= 0) {
            toast.warning('Sản phẩm đã hết hàng');
            return;
        }

        if (Number(item.quantity || 0) >= availableStock) {
            toast.warning(`Chỉ còn ${availableStock} sản phẩm`);
            return;
        }

        await quantityChange(item.cartItemId, Number(item.quantity || 0) + 1);
    }

    async function handleDecrease(cartItemId) {
        const item = findCartItem(cartItemId);

        if (!item) return;

        if (Number(item.quantity || 0) <= 1) return;

        await quantityChange(item.cartItemId, Number(item.quantity || 0) - 1);
    }

    function handleRemove(cartItemId) {
        const item = findCartItem(cartItemId);

        if (!item) return;

        setConfirmDialog({
            open: true,
            title: 'Xóa sản phẩm khỏi giỏ hàng',
            message: `Bạn muốn xóa "${item.name}" khỏi giỏ hàng?`,
            description: 'Sản phẩm đã xóa sẽ không còn nằm trong giỏ hàng của bạn.',
            confirmText: 'Xóa sản phẩm',
            type: 'danger',
            onConfirm: async () => {
                await removeOneItem(cartItemId);
            },
        });
    }

    async function removeOneItem(cartItemId) {
        try {
            await removeCart(cartItemId);

            setSelectedIds((current) => {
                return current.filter((id) => String(id) !== String(cartItemId));
            });

            toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
        }
    }

    function handleRemoveSelected() {
        if (selectedIds.length === 0) {
            toast.warning('Vui lòng chọn sản phẩm cần xóa');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Xóa sản phẩm đã chọn',
            message: `Bạn muốn xóa ${selectedIds.length} sản phẩm đã chọn khỏi giỏ hàng?`,
            description: 'Các sản phẩm đã chọn sẽ bị xóa khỏi giỏ hàng.',
            confirmText: 'Xóa đã chọn',
            type: 'danger',
            onConfirm: removeSelectedItems,
        });
    }

    async function removeSelectedItems() {
        try {
            const idsToRemove = [...selectedIds];

            for (const cartItemId of idsToRemove) {
                await removeCart(cartItemId);
            }

            setSelectedIds([]);
            toast.success('Đã xóa sản phẩm đã chọn');
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa sản phẩm đã chọn');
        }
    }

    function handleClear() {
        if (cartItems.length === 0) {
            toast.info('Giỏ hàng đang trống');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Xóa toàn bộ giỏ hàng',
            message: `Bạn muốn xóa toàn bộ ${cartItems.length} sản phẩm trong giỏ hàng?`,
            description: 'Toàn bộ sản phẩm trong giỏ hàng sẽ bị xóa. Thao tác này không thể hoàn tác trên giao diện.',
            confirmText: 'Xóa toàn bộ',
            type: 'danger',
            onConfirm: clearAllItems,
        });
    }

    async function clearAllItems() {
        try {
            await clearCart();

            setSelectedIds([]);
            toast.success('Đã xóa toàn bộ giỏ hàng');
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa toàn bộ giỏ hàng');
        }
    }

    function findCartItem(cartItemId) {
        return cartItems.find((item) => String(item.cartItemId) === String(cartItemId));
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-2">
                <Breadcrumb />

                <section className="mb-6">
                    <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white md:text-3xl">
                        Giỏ hàng{' '}
                        <span className="text-base font-bold text-slate-500 dark:text-slate-400">
                            ({totalItems || cartItems.length} sản phẩm)
                        </span>
                    </h1>
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
                                <CartSummary
                                    originalSubtotal={originalSubtotal}
                                    subtotal={subtotal}
                                    discount={discountTotal}
                                    itemCount={selectedCount}
                                    selectedIds={selectedIds}
                                />

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

                <ConfirmDialog
                    open={confirmDialog.open}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    description={confirmDialog.description}
                    confirmText={confirmDialog.confirmText}
                    type={confirmDialog.type}
                    onConfirm={confirmDialog.onConfirm}
                    onOpenChange={(open) => {
                        setConfirmDialog((prev) => ({
                            ...prev,
                            open,
                        }));
                    }}
                />
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
        <div className="mb-2 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>
            <ChevronRight size={14} />
            <span className="text-blue-950 dark:text-blue-300">Giỏ hàng</span>
        </div>
    );
}
