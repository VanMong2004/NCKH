export const orderSuccess = {
    orderCode: 'ORD-2024-000123',
    orderDate: '20/05/2024 - 10:30',
    email: 'nguyenvana@example.com',
    qrImage: '/images/order-qr.png',
};

export const pickupGuide = {
    location: 'Phòng Công tác chính trị - Sinh viên - Khởi nghiệp',
    address: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
    time: ['Thứ Hai - Thứ Sáu: 08:00 - 18:00', 'Thứ Bảy: 08:00 - 12:00'],
    bring: ['Thẻ sinh viên / MSSV', 'Mã đơn hàng', 'Số điện thoại hợp lệ'],
};

export const orderTimeline = [
    {
        id: 1,
        title: 'Đã tạo đơn',
        desc: '20/05/2024 - 10:30',
        status: 'Hoàn thành',
        active: true,
        done: true,
    },
    {
        id: 2,
        title: 'Đang chuẩn bị',
        desc: 'Hệ thống đang chuẩn bị đơn hàng của bạn',
        status: 'Đang xử lý',
        active: true,
        done: false,
    },
    {
        id: 3,
        title: 'Sẵn sàng nhận hàng',
        desc: 'Bạn sẽ nhận được thông báo khi đơn hàng sẵn sàng',
        status: 'Chờ xử lý',
        active: false,
        done: false,
    },
    {
        id: 4,
        title: 'Hoàn thành',
        desc: 'Cảm ơn bạn đã mua sắm tại CTUT UniShop',
        status: 'Chờ xử lý',
        active: false,
        done: false,
    },
];
