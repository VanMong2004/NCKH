export const checkoutItems = [
    {
        id: 1,
        name: 'ABC Polo Shirt',
        variant: 'Size: M · Color: White',
        price: 250000,
        quantity: 1,
        image: '/images/product-shirt.jpg',
    },
    {
        id: 2,
        name: 'ABC Backpack',
        variant: 'Color: Navy',
        price: 320000,
        quantity: 2,
        image: '/images/product-bag.jpg',
    },
    {
        id: 3,
        name: 'ABC Cap',
        variant: 'Color: Navy',
        price: 120000,
        quantity: 1,
        image: '/images/product-cap.jpg',
    },
    {
        id: 4,
        name: 'Student ID Card',
        variant: '',
        price: 45000,
        quantity: 1,
        image: '/images/product-card.jpg',
    },
];

export const paymentMethods = [
    {
        id: 'cod',
        name: 'Cash on Delivery (COD)',
        desc: 'Pay when you receive the goods',
        icon: '💵',
    },
    {
        id: 'bank',
        name: 'Bank Transfer',
        desc: 'Transfer directly to our bank account',
        icon: '🏦',
    },
    {
        id: 'momo',
        name: 'MoMo',
        desc: 'Pay securely with MoMo wallet',
        icon: '🟪',
    },
    {
        id: 'vnpay',
        name: 'VNPay',
        desc: 'Pay with VNPay QR or card',
        icon: '💳',
    },
    {
        id: 'free',
        name: 'Free',
        desc: 'Free order / 0đ payment',
        icon: 'FREE',
    },
];

export function formatMoney(value) {
    return value.toLocaleString('vi-VN') + ' đ';
}
