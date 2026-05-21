export const cartItems = [
  {
    id: 1,
    name: 'ABC Polo Shirt',
    category: 'Đồng phục',
    size: 'M',
    color: 'White',
    price: 250000,
    quantity: 1,
    image: '/images/product-shirt.jpg',
    selected: true,
  },
  {
    id: 2,
    name: 'ABC Backpack',
    category: 'Balo sinh viên',
    size: null,
    color: 'Navy',
    price: 320000,
    quantity: 2,
    image: '/images/product-bag.jpg',
    selected: true,
  },
  {
    id: 3,
    name: 'ABC Cap',
    category: 'Nón kết',
    size: null,
    color: 'Navy',
    price: 120000,
    quantity: 1,
    image: '/images/product-cap.jpg',
    selected: true,
  },
  {
    id: 4,
    name: 'Student ID Card',
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