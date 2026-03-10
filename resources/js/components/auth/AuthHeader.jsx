import { Link, useLocation } from 'react-router-dom';
import logoImg from '../../../images/logo.png';

function AuthHeader() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/auth/dangnhap';
    const isForgotPassword = location.pathname === '/auth/quenmatkhau';

    return (
        <header className="sticky top-0 z-40 bg-surface border-b border-default">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                            <img src={logoImg} alt="logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-lg md:text-xl text-gray-900 dark:text-white">CTUT Store</span>
                    </Link>

                    <nav className="flex items-center gap-6 sm:gap-8">
                        {isForgotPassword ? (
                            <div className="flex items-center gap-4">
                                <span className="text-muted text-sm">Need Help?</span>
                            </div>
                        ) : (
                            <>
                                {['/', '/sanpham', '/lienhe'].map((path, i) => (
                                    <Link
                                        key={i}
                                        to={path}
                                        className="text-body hover:text-title text-sm font-medium transition-colors"
                                    >
                                        {path === '/' ? 'Trang chủ' : path === '/sanpham' ? 'Sản phẩm' : 'Phụ kiện'}
                                    </Link>
                                ))}
                            </>
                        )}

                        {isLoginPage ? (
                            <Link to="/auth/dangky" className="btn-secondary text-sm">
                                Đăng ký
                            </Link>
                        ) : (
                            <Link to="/auth/dangnhap" className="btn-primary text-sm">
                                Đăng nhập
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default AuthHeader;
