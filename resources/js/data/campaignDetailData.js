export const campaignDetail = {
    id: 1,
    title: 'Đồng phục ABC 2024',
    banner: '/images/campaign-detail-banner.jpg',
    progress: 72,
    registered: 1436,
    total: 2000,
    time: ['11', '08', '24', '36'],
};

export const campaignProducts = [
    {
        id: 1,
        name: 'Áo Polo ABC 2024',
        price: 250000,
        priceText: '250.000 đ',
        image: '/images/product-shirt.jpg',
        rating: 4.8,
        reviews: 128,
        registered: '892 / 1.000',
        options: ['M', 'L', 'XL'],
        colors: ['bg-white', 'bg-blue-950', 'bg-slate-800'],
    },
    {
        id: 2,
        name: 'Áo Khoác Gió ABC 2024',
        price: 350000,
        priceText: '350.000 đ',
        image: '/images/product-jacket.jpg',
        rating: 4.7,
        reviews: 93,
        registered: '456 / 600',
        options: ['M', 'L', 'XL'],
        colors: ['bg-blue-950', 'bg-black'],
    },
    {
        id: 3,
        name: 'Balo Sinh Viên ABC',
        price: 320000,
        priceText: '320.000 đ',
        image: '/images/product-bag.jpg',
        rating: 4.9,
        reviews: 87,
        registered: '612 / 800',
        options: ['Standard'],
        colors: ['bg-blue-950'],
    },
    {
        id: 4,
        name: 'Thẻ Sinh Viên ABC',
        price: 45000,
        priceText: '45.000 đ',
        image: '/images/product-card.jpg',
        rating: 4.9,
        reviews: 63,
        registered: '120 / 200',
        options: ['Thẻ cứng'],
        colors: ['bg-blue-600'],
    },
];

export const campaignFAQ = [
    'Khi nào em nhận được hàng?',
    'Em có thể thay đổi size sau khi đã đăng ký không?',
    'Nếu em chọn Pay Later thì khi nào phải thanh toán nốt?',
    'Chính sách đổi trả như thế nào?',
    'Em có thể hủy đơn hàng không?',
    'Ai liên hệ nếu em có thắc mắc?',
];

export function formatMoney(value) {
    return value.toLocaleString('vi-VN') + ' đ';
}
