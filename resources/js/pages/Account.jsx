import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AccountSidebar from '../components/account/AccountSidebar';
import AccountSidebarMobile from '../components/account/AccountSidebarMobile';
import OrdersHistory from '../components/account/OrdersHistory';
import ProfileDetails from '../components/account/ProfileDetails';
import ShippingAddresses from '../components/account/ShippingAddress';
import Breadcrumb from '../components/common/Breadcrumb';
import { mockAddress } from '../data/mockAddress';
import { mockOrders } from '../data/mockOrders';

function Account() {
    const [searchParams] = useSearchParams();
    const tabURL = searchParams.get('tab') || 'thongtinchitiet';

    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(tabURL);
    const [userData, setUserData] = useState({
        firstName: 'Lê',
        lastName: 'Văn Mộng',
        email: 'lvmong@student.ctut.edu.vn',
        studentId: 'KTPM2211055',
        phone: '0901234567',
    });
    const [showAccountMenu, setShowAccountMenu] = useState(false);

    // đồng bộ khi URL đổi
    useEffect(() => {
        setActiveTab(tabURL);
    }, [tabURL]);

    return (
        <main className="max-w-7xl mx-auto px-4 bg-page">
            {/* Breadcrumb */}
            <Breadcrumb items={['Trang chủ', 'Thông tin tài khoản']} to={['/', 'account']} />

            <div className="sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <aside className="hidden lg:block lg:col-span-1">
                        <AccountSidebar
                            activeTab={activeTab}
                            onTabChange={(tab) => {
                                setActiveTab(tab);
                                navigate(`/taikhoan?tab=${tab}`);
                            }}
                        />
                    </aside>

                    {/* Main */}
                    <div className="lg:col-span-3">
                        {/* ---------- Sidebar Mobile ---------- */}
                        <AccountSidebarMobile
                            showAccountMenu={showAccountMenu}
                            onShowAccountMenu={setShowAccountMenu}
                            activeTab={activeTab}
                            onActiveTab={setActiveTab}
                        />

                        {/* DETAILS */}
                        {activeTab === 'thongtinchitiet' && (
                            <div>
                                <ProfileDetails
                                    userData={userData}
                                    onUserData={setUserData}
                                    onActiveTab={setActiveTab}
                                />
                            </div>
                        )}

                        {/* ORDERS */}
                        {activeTab === 'donhang' && (
                            <div>
                                <OrdersHistory orders={mockOrders} showAll />
                            </div>
                        )}

                        {/* ADDRESSES */}
                        {activeTab === 'diachicanhan' && (
                            <div>
                                <ShippingAddresses addresses={mockAddress} />
                            </div>
                        )}

                        {/* PAYMENT */}
                        {activeTab === 'thanhtoan' && (
                            <div>
                                <h2 className="text-2xl font-bold text-title mb-6">Phương thức thanh toán</h2>

                                <div className="space-y-4">
                                    <div className="border-default rounded-lg p-4 flex items-center justify-between bg-surface">
                                        <div>
                                            <p className="font-medium text-title">Vietcombank</p>
                                            <p className="text-sm text-muted">**** **** **** 4242</p>
                                        </div>
                                        <span className="text-sm font-medium text-blue-600">Mặc định</span>
                                    </div>

                                    <button className="btn-secondary w-full border-dashed">
                                        + Thêm phương thức thanh toán
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Account;
