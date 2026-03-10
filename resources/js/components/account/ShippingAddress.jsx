'use client';

import { MapPin, Trash2, Edit, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function ShippingAddresses({ addresses: initAddress, onActiveTab, showIcon = false }) {
    const [addresses, setAddresses] = useState(initAddress);
    const [editingAddress, setEditingAddress] = useState(null);
    const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

    const handleSetDefault = (id) => {
        setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    };

    const handleEdit = (e, address) => {
        e.stopPropagation();
        setEditingAddress(address);
        setFormData(address);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
            setAddresses(addresses.filter((a) => a.id !== id));
        }
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        setAddresses(addresses.map((a) => (a.id === editingAddress.id ? { ...a, ...formData } : a)));
        setEditingAddress(null);
    };

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-title">Địa chỉ</h2>
                {showIcon && (
                    <button onClick={() => onActiveTab('addresses')} className="text-muted">
                        <ArrowRight className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {addresses.map((address) => (
                    <div
                        key={address.id}
                        onClick={() => !address.isDefault && handleSetDefault(address.id)}
                        className={`border-default rounded-lg p-4 transition-colors ${
                            address.isDefault
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                        }`}
                    >
                        <div className="flex justify-between">
                            <div>
                                <p className="font-semibold text-title">{address.name}</p>
                                <p className="text-body">{address.address}</p>
                                <p className="text-muted">{address.city}</p>
                                <p className="text-muted mt-1">📞 {address.phone}</p>
                            </div>

                            {!showIcon && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => handleEdit(e, address)}
                                        className="text-muted hover:text-title"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => handleDelete(e, address.id)} className="text-error">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {!showIcon && (
                    <button className="btn-secondary w-full flex items-center justify-center gap-2 py-4">
                        <span className="text-xl">+</span> Thêm địa chỉ
                    </button>
                )}
            </div>

            {editingAddress && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-md">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-bold text-title">Chỉnh sửa địa chỉ</h3>
                            <button onClick={() => setEditingAddress(null)} className="text-muted">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <input className="input-base w-full" value={formData.name} />
                            <input className="input-base w-full" value={formData.address} />
                            <input className="input-base w-full" value={formData.phone} />

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingAddress(null)}
                                    className="btn-secondary flex-1"
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    Lưu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
