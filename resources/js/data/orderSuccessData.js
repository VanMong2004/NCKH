export const orderSuccess = {
    orderCode: 'ABCU-2024-000123',
    orderDate: 'May 20, 2024 - 10:30 AM',
    email: 'alex.nguyen@abcuni.edu.vn',
    qrImage: '/images/order-qr.png',
};

export const pickupGuide = {
    location: 'ABC University - Main Campus Store',
    address: '123 University Road, City, Country',
    time: ['Mon - Fri: 8:00 AM - 6:00 PM', 'Sat: 8:00 AM - 12:00 PM'],
    bring: ['Student ID / MSSV', 'Order QR code or Order Code', 'Valid phone number'],
};

export const orderTimeline = [
    {
        id: 1,
        title: 'Order Placed',
        desc: 'May 20, 2024 - 10:30 AM',
        status: 'Completed',
        active: true,
        done: true,
    },
    {
        id: 2,
        title: 'Processing',
        desc: 'We are preparing your order',
        status: 'In Progress',
        active: true,
        done: false,
    },
    {
        id: 3,
        title: 'Ready for Pickup',
        desc: 'You will receive a notification when your order is ready',
        status: 'Pending',
        active: false,
        done: false,
    },
    {
        id: 4,
        title: 'Order Completed',
        desc: 'Thank you for shopping with ABC University',
        status: 'Pending',
        active: false,
        done: false,
    },
];
