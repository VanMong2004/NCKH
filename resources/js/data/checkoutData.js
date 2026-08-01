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
        name: 'Thanh toán khi nhận hàng',
        desc: 'Thanh toán khi bạn nhận được sản phẩm',
        icon: 'COD',
    },
    {
        id: 'mock_bank',
        name: 'Chuyển khoản ngân hàng',
        desc: 'Thanh toán qua cổng giả lập ngân hàng của hệ thống',
        icon: 'BANK',
    },
    {
        id: 'free',
        name: 'Miễn phí',
        desc: 'Đơn hàng không phát sinh thanh toán',
        icon: 'FREE',
    },
];

export function formatMoney(value) {
    return value.toLocaleString('vi-VN') + ' đ';
}
