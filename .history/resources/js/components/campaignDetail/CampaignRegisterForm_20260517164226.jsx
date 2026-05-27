import { useMemo, useState } from 'react';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { formatMoney } from '../../data/campaignDetailData';

export default function CampaignRegisterForm() {
    const [quantity, setQuantity] = useState(2);
    const price = 250000;

    const total = useMemo(() => price * quantity, [quantity]);

    return (
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-28">
            <h2 className="text-xl font-bold text-blue-950">Đăng ký tham gia</h2>
            <p className="mt-1 text-sm text-slate-500">Vui lòng điền đầy đủ thông tin</p>

            <div className="mt-5 space-y-4">
                <Input label="MSSV" placeholder="Nhập MSSV" required />
                <Input label="Họ và tên" placeholder="Nhập họ và tên" required />

                <Select label="Khoa" placeholder="Chọn khoa" required />
                <Select label="Lớp" placeholder="Chọn lớp" required />

                <Input label="Số điện thoại" placeholder="Nhập số điện thoại" required />
                <Input label="Email" placeholder="Nhập email" />
            </div>

            <div className="my-5 border-t border-slate-200" />

            <h3 className="font-bold text-blue-950">Sản phẩm đăng ký</h3>

            <div className="mt-4 flex gap-3">
                <img
                    src="/images/product-shirt.jpg"
                    alt=""
                    className="h-20 w-20 rounded-xl bg-slate-50 object-contain"
                />

                <div className="flex-1">
                    <h4 className="font-bold text-blue-950">Áo Polo ABC 2024</h4>
                    <p className="text-sm text-slate-500">Size: M · Màu: Trắng</p>
                    <p className="mt-1 font-bold text-blue-950">{formatMoney(price)}</p>

                    <div className="mt-3 flex items-center justify-between">
                        <Quantity
                            value={quantity}
                            onMinus={() => setQuantity(Math.max(1, quantity - 1))}
                            onPlus={() => setQuantity(quantity + 1)}
                        />

                        <span className="font-bold text-blue-950">{formatMoney(total)}</span>
                    </div>
                </div>
            </div>

            <button className="mt-4 w-full rounded-lg border border-dashed border-blue-300 py-3 font-bold text-blue-700">
                + Thêm sản phẩm khác
            </button>

            <div className="my-5 border-t border-slate-200" />

            <h3 className="font-bold text-blue-950">Hình thức thanh toán</h3>

            <div className="mt-3 space-y-3">
                <PaymentOption title="Pay Now" desc="Thanh toán ngay 100%" active />
                <PaymentOption title="Pay Later" desc="Đặt cọc 30% - Thanh toán nốt khi nhận hàng" />
                <PaymentOption title="Free" desc="Áp dụng cho sản phẩm hỗ trợ" />
            </div>

            <div className="my-5 border-t border-slate-200" />

            <h3 className="font-bold text-blue-950">Tổng thanh toán</h3>

            <div className="mt-3 space-y-3 text-sm">
                <Row label={`Tạm tính (${quantity} sản phẩm)`} value={formatMoney(total)} />
                <Row label="Phí vận chuyển (dự kiến)" value="0 đ" />
                <Row label="Ưu đãi" value="- 0 đ" />
            </div>

            <div className="my-4 border-t border-slate-200" />

            <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950">Tổng cộng</span>
                <span className="text-xl font-extrabold text-blue-700">{formatMoney(total)}</span>
            </div>

            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
                Bằng cách nhấn “Đăng ký ngay”, bạn đồng ý với Điều khoản sử dụng và Chính sách của chúng tôi.
            </p>

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-950 py-4 font-bold text-white">
                Đăng ký ngay
                <ArrowRight size={18} />
            </button>

            <p className="mt-5 text-center text-sm text-slate-500">Thanh toán an toàn & bảo mật</p>
        </aside>
    );
}

function Input({ label, placeholder, required }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950">
                {label} {required && <span className="text-red-500">*</span>}
            </span>

            <input
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-950"
            />
        </label>
    );
}

function Select({ label, placeholder, required }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950">
                {label} {required && <span className="text-red-500">*</span>}
            </span>

            <select className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-500 outline-none focus:border-blue-950">
                <option>{placeholder}</option>
            </select>
        </label>
    );
}

function Quantity({ value, onMinus, onPlus }) {
    return (
        <div className="flex overflow-hidden rounded-lg border border-slate-200">
            <button onClick={onMinus} className="flex h-9 w-9 items-center justify-center">
                <Minus size={15} />
            </button>
            <span className="flex h-9 w-10 items-center justify-center border-x border-slate-200 font-bold">
                {value}
            </span>
            <button onClick={onPlus} className="flex h-9 w-9 items-center justify-center">
                <Plus size={15} />
            </button>
        </div>
    );
}

function PaymentOption({ title, desc, active = false }) {
    return (
        <button
            className={`flex w-full gap-3 rounded-xl border p-4 text-left ${
                active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
            }`}
        >
            <span
                className={`mt-1 h-4 w-4 rounded-full border ${
                    active ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}
            />

            <div>
                <h4 className="font-bold text-blue-950">{title}</h4>
                <p className="text-sm text-slate-500">{desc}</p>
            </div>
        </button>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between">
            <span className="text-slate-600">{label}</span>
            <span className="font-bold text-blue-950">{value}</span>
        </div>
    );
}
