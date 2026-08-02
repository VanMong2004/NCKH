export const cartItems = [
    {
        id: 1,
        name: 'Áo polo CTUT',
        category: 'Đồng phục',
        size: 'M',
        color: 'Trắng',
        price: 250000,
        quantity: 1,
        image: '/images/product-shirt.jpg',
        selected: true,
    },
    {
        id: 2,
        name: 'Balo CTUT',
        category: 'Balo sinh viên',
        size: null,
        color: 'Xanh navy',
        price: 320000,
        quantity: 2,
        image: '/images/product-bag.jpg',
        selected: true,
    },
    {
        id: 3,
        name: 'Nón kết CTUT',
        category: 'Nón kết',
        size: null,
        color: 'Xanh navy',
        price: 120000,
        quantity: 1,
        image: '/images/product-cap.jpg',
        selected: true,
    },
    {
        id: 4,
        name: 'Bảng tên sinh viên',
        category: 'Thẻ sinh viên',
        size: null,
        color: null,
        price: 45000,
        quantity: 1,
        image: '/images/product-card.jpg',
        selected: true,
    },
];

export function formatMoney(value) {
    return value.toLocaleString('vi-VN') + ' đ';
}
