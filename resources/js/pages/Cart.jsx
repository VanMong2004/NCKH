'use client';

import { useState } from 'react';
import { Trash2, ChevronLeft, Plus, Minus } from 'lucide-react';
import CartItem from '@/components/CartItem';
import OrderSummary from '@/components/OrderSummary';
import CompleteYourLook from '@/components/CompleteYourLook';

// Mock cart items
const MOCK_CART_ITEMS = [
  {
    id: 1,
    name: 'CTUT Standard Uniform Shirt - Male',
    price: 15.00,
    quantity: 1,
    size: 'L',
    color: 'White',
    image: '/white-dress-shirt-folded.jpg',
    inStock: true,
  },
  {
    id: 2,
    name: 'Department of IT Innovation Hoodie',
    price: 25.00,
    quantity: 1,
    size: 'M',
    color: 'Heather Grey',
    image: '/premium-id-lanyard-orange.jpg',
    inStock: true,
  },
  {
    id: 3,
    name: 'Physical Education Kit',
    price: 12.00,
    quantity: 1,
    size: 'XL',
    color: 'Set: Shorts & Tee',
    image: '/pe-sport-set-blue-unisex.jpg',
    inStock: false,
  },
];

// Mock recommended products
const MOCK_RECOMMENDED = [
  {
    id: 10,
    name: 'CTUT Spiral Notebook',
    price: 4.50,
    image: '/male-student-polo-shirt.jpg',
  },
  {
    id: 11,
    name: 'Athletic Socks (3-Pack)',
    price: 8.00,
    image: '/male-student-polo-uniform-front.jpg',
  },
  {
    id: 12,
    name: 'Standard Lab Coat',
    price: 18.00,
    image: '/white-lab-coat.png',
  },
  {
    id: 13,
    name: 'CTUT Metal Water Bottle',
    price: 12.00,
    image: '/blue-necktie-with-university-logo.jpg',
  },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState(MOCK_CART_ITEMS);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const studentDiscount = subtotal * 0.05; // 5% student discount
  const tax = 0; // VAT included
  const total = subtotal - studentDiscount + tax;

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCartItems(
      cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const handleApplyPromo = () => {
    if (promoCode.trim() === 'STUDENT10') {
      setAppliedPromo('STUDENT10');
    } else {
      setAppliedPromo(null);
    }
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      setCartItems([]);
    }
  };

  const isCartEmpty = cartItems.length === 0;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Your Cart
            {!isCartEmpty && <span className="text-lg font-normal text-gray-600 ml-2">({cartItems.length} items)</span>}
          </h1>
          <p className="text-sm text-gray-600 mt-1">Free pickup available at CTUT Main Campus, Building A.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isCartEmpty ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500 mb-4">Your cart is empty</p>
            <a href="/products" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-sm text-gray-700">
                  <div className="col-span-5">PRODUCT DETAILS</div>
                  <div className="col-span-2">PRICE</div>
                  <div className="col-span-2">QUANTITY</div>
                  <div className="col-span-2">TOTAL</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-gray-200">
                  {cartItems.map(item => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <a href="/products" className="flex items-center justify-center gap-2 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                  <ChevronLeft className="w-4 h-4" />
                  Continue Shopping
                </a>
                <button
                  onClick={handleClearCart}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <OrderSummary
              subtotal={subtotal}
              studentDiscount={studentDiscount}
              tax={tax}
              total={total}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              onApplyPromo={handleApplyPromo}
              appliedPromo={appliedPromo}
            />
          </div>
        )}
      </div>

      {/* Complete Your Look Section */}
      {!isCartEmpty && <CompleteYourLook products={MOCK_RECOMMENDED} />}
    </main>
  );
}
