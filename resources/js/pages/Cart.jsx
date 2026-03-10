import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import CartItem from '../components/cart/CartItem';
import OrderSummary from '../components/cart/OrderSummary';
import Breadcrumb from '../components/common/Breadcrumb';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';

function Cart() {
    // LẤY DỮ LIỆU TỪ CONTEXT
    const { cartItems, removeCart, clearCart, totalPrice, totalItems, quantityChange } = useCart();

    const handleClearCart = () => {
        Swal.fire({
            title: 'Xóa giỏ hàng?',
            text: 'Bạn có chắc muốn xóa sạch giỏ hàng không?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa hết',
            cancelButtonText: 'Giữ lại',
        }).then((result) => {
            if (result.isConfirmed) {
                clearCart();
                Swal.fire('Đã xóa!', '', 'success');
            }
        });
    };

    const isCartEmpty = cartItems.length === 0;

    return (
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 bg-page">
            <div className="hidden md:block">
                <Breadcrumb items={['Trang chủ', 'Giỏ hàng']} to={['/', '/giohang']} />
            </div>

            {/* HEADER */}
            <div className="card p-4 my-4 flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold text-title flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                    Giỏ hàng
                    {!isCartEmpty && (
                        <span className="text-sm font-medium text-muted bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {totalItems} sản phẩm
                        </span>
                    )}
                </h1>

                {!isCartEmpty && (
                    <button onClick={handleClearCart} className="btn-danger flex items-center gap-1.5 px-3 py-1.5">
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-semibold">Xóa tất cả</span>
                    </button>
                )}
            </div>

            {/* MAIN */}
            <div className="pb-8">
                {isCartEmpty ? (
                    <div className="card p-12 text-center">
                        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-12 h-12 text-blue-300 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-title mb-2">Giỏ hàng của bạn đang trống</h2>
                        <p className="text-muted mb-4 max-w-md mx-auto">Bạn chưa thêm sản phẩm nào vào giỏ.</p>
                        <Link to="/sanpham" className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl">
                            <ArrowLeft className="w-4 h-4" />
                            Tiếp tục mua hàng
                        </Link>
                    </div>
                ) : (
                    <>
                        <Link to="/sanpham" className="btn-link mb-4 inline-flex items-center gap-2 w-full md:w-auto">
                            <ArrowLeft className="w-4 h-4" />
                            Tiếp tục mua sắm
                        </Link>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* DANH SÁCH SẢN PHẨM */}
                            <div className="lg:col-span-2 flex flex-col gap-4">
                                <div className="card overflow-hidden">
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-800 font-semibold text-sm text-muted border-b border-default">
                                        <div className="col-span-5">Sản phẩm</div>
                                        <div className="col-span-2 text-center">Đơn giá</div>
                                        <div className="col-span-2 text-center">Số lượng</div>
                                        <div className="col-span-2 text-right">Thành tiền</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {cartItems.map((item) => (
                                            <CartItem
                                                key={`${item.id}-${item.size ?? 'no-size'}`}
                                                item={item}
                                                onQuantityChange={(qty) => quantityChange(item.cartItemId, qty)}
                                                onRemove={() => removeCart(item.cartItemId)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* TỔNG QUAN */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-4">
                                    <OrderSummary total={totalPrice} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default Cart;
