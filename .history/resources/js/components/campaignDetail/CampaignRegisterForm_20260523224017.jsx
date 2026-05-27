import { useMemo, useState } from 'react';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import campaignService from '../../services/campaignService';

export default function CampaignRegisterForm({ campaign = {} }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const products = campaign.items || [];
    const firstProduct = products[0];

    const [campaignItemId, setCampaignItemId] = useState(firstProduct?.id || '');
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);

    const selectedProduct = useMemo(() => {
        return products.find((item) => String(item.id) === String(campaignItemId)) || firstProduct;
    }, [products, campaignItemId, firstProduct]);

    const price = Number(selectedProduct?.price || 0);
    const total = price * quantity;

    const canRegister = (campaign.status === 'active' || campaign.status === 'upcoming') && selectedProduct;

    async function handleSubmit() {
        if (!user) {
            toast.warning('Vui lòng đăng nhập để đăng ký chiến dịch');

            navigate('/login', {
                state: {
                    from: `/campaigns/${campaign.id}`,
                },
            });

            return;
        }

        if (!canRegister) {
            toast.warning('Chiến dịch chưa thể đăng ký hoặc chưa có sản phẩm');
            return;
        }

        if (!campaignItemId) {
            toast.warning('Vui lòng chọn sản phẩm');
            return;
        }

        if (quantity < 1) {
            toast.warning('Số lượng phải lớn hơn 0');
            return;
        }

        if (selectedProduct?.remainingQuantity && quantity > selectedProduct.remainingQuantity) {
            toast.warning('Số lượng vượt quá số lượng còn lại');
            return;
        }

        try {
            setLoading(true);

            const result = await campaignService.register(campaign.id, {
                campaign_item_id: campaignItemId,
                quantity,
                payment_method: paymentMethod,
            });

            toast.success('Đăng ký chiến dịch thành công');

            const registrationId = result?.data?.id || result?.id || campaign.id;

            navigate(`/campaign-registration-success/${registrationId}`);
        } catch (error) {
            toast.error(error.message || 'Không thể đăng ký chiến dịch');
        } finally {
            setLoading(false);
        }
    }

    return (
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-28">
            <h2 className="text-xl font-bold text-blue-950 dark:text-white">Đăng ký tham gia</h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chọn sản phẩm và số lượng muốn đăng ký.</p>

            <div className="my-5 border-t border-slate-200 dark:border-slate-800" />

            <h3 className="font-bold text-blue-950 dark:text-white">Sản phẩm đăng ký</h3>

            {products.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700">
                    Chiến dịch chưa có sản phẩm để đăng ký.
                </div>
            ) : (
                <>
                    <label className="mt-4 block">
                        <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">
                            Chọn sản phẩm
                        </span>

                        <select
                            value={campaignItemId}
                            onChange={(e) => {
                                setCampaignItemId(e.target.value);
                                setQuantity(1);
                            }}
                            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            {products.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.product?.name || 'Sản phẩm'} - {item.variant?.size || 'Size'} -{' '}
                                    {item.variant?.color || 'Màu'}
                                </option>
                            ))}
                        </select>
                    </label>

                    {selectedProduct && (
                        <div className="mt-4 flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                            <img
                                src={selectedProduct.product?.thumbnail || '/images/no-image.png'}
                                alt={selectedProduct.product?.name || 'Sản phẩm'}
                                className="h-20 w-20 rounded-xl bg-slate-50 object-contain dark:bg-slate-950"
                                onError={(e) => {
                                    e.currentTarget.src = '/images/no-image.png';
                                }}
                            />

                            <div className="min-w-0 flex-1">
                                <h4 className="line-clamp-2 font-bold text-blue-950 dark:text-white">
                                    {selectedProduct.product?.name || 'Sản phẩm'}
                                </h4>

                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Size: {selectedProduct.variant?.size || '—'} · Màu:{' '}
                                    {selectedProduct.variant?.color || '—'}
                                </p>

                                <p className="mt-1 font-bold text-blue-950 dark:text-blue-300">{formatMoney(price)}</p>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <Quantity
                                        value={quantity}
                                        max={selectedProduct.remainingQuantity || 999}
                                        onMinus={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                        onPlus={() => {
                                            const max = selectedProduct.remainingQuantity || 999;
                                            setQuantity((prev) => Math.min(max, prev + 1));
                                        }}
                                    />

                                    <span className="font-bold text-blue-950 dark:text-white">
                                        {formatMoney(total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="my-5 border-t border-slate-200 dark:border-slate-800" />

            <h3 className="font-bold text-blue-950 dark:text-white">Hình thức thanh toán</h3>

            <div className="mt-3 space-y-3">
                <PaymentOption
                    value="cod"
                    title="Thanh toán khi nhận hàng"
                    desc="Phù hợp khi nhận sản phẩm trực tiếp."
                    active={paymentMethod === 'cod'}
                    onClick={setPaymentMethod}
                />

                <PaymentOption
                    value="mock"
                    title="Thanh toán mô phỏng"
                    desc="Dùng để kiểm thử trên môi trường local."
                    active={paymentMethod === 'mock'}
                    onClick={setPaymentMethod}
                />
            </div>

            <div className="my-5 border-t border-slate-200 dark:border-slate-800" />

            <h3 className="font-bold text-blue-950 dark:text-white">Tổng thanh toán</h3>

            <div className="mt-3 space-y-3 text-sm">
                <Row label={`Tạm tính (${quantity} sản phẩm)`} value={formatMoney(total)} />
                <Row label="Phí vận chuyển" value="0 đ" />
                <Row label="Ưu đãi" value="- 0 đ" />
            </div>

            <div className="my-4 border-t border-slate-200 dark:border-slate-800" />

            <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 dark:text-white">Tổng cộng</span>

                <span className="text-xl font-extrabold text-blue-700 dark:text-blue-300">{formatMoney(total)}</span>
            </div>

            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                Bằng cách nhấn “Đăng ký ngay”, bạn đồng ý với điều khoản của chiến dịch.
            </p>

            <button
                type="button"
                disabled={!canRegister || loading}
                onClick={handleSubmit}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-950 py-4 font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700"
            >
                {loading ? 'Đang đăng ký...' : 'Đăng ký ngay'}
                <ArrowRight size={18} />
            </button>

            <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                Thông tin đăng ký sẽ được ghi nhận trên hệ thống.
            </p>
        </aside>
    );
}

function Quantity({ value, max, onMinus, onPlus }) {
    return (
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onMinus} className="flex h-9 w-9 items-center justify-center">
                <Minus size={16} />
            </button>

            <span className="w-10 text-center font-bold">{value}</span>

            <button
                type="button"
                onClick={onPlus}
                disabled={value >= max}
                className="flex h-9 w-9 items-center justify-center disabled:opacity-40"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}

function PaymentOption({ value, title, desc, active, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={`w-full rounded-xl border p-4 text-left transition ${
                active
                    ? 'border-blue-950 bg-blue-50 dark:border-blue-300 dark:bg-blue-950/30'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950'
            }`}
        >
            <p className="font-bold text-blue-950 dark:text-white">{title}</p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
        </button>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className="font-bold text-blue-950 dark:text-white">{value}</span>
        </div>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
