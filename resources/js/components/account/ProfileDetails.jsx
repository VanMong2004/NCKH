'use client';

import { useState } from 'react';
import { ArrowRight, Edit, Save, X, User, Mail, IdCard } from 'lucide-react';

export default function ProfileDetails({ userData, onUserData, onActiveTab, showIcon = false }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(userData);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = () => {
        onUserData(formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData(userData);
        setIsEditing(false);
    };

    return (
        <div className="card p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
                <div>
                    <h2 className="text-2xl font-bold text-title mb-1">Thông tin cá nhân</h2>
                    <p className="text-muted text-sm">Quản lý thông tin tài khoản của bạn</p>
                </div>

                {showIcon && (
                    <button
                        onClick={() => onActiveTab('details')}
                        className="text-muted hover:text-title transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                )}

                {!isEditing && !showIcon && (
                    <button onClick={() => setIsEditing(true)} className="btn-primary flex items-center gap-2">
                        <Edit className="w-4 h-4" /> Chỉnh sửa
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-6">
                    {/* Form grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label flex items-center gap-2">
                                <User className="w-4 h-4 text-muted" />
                                Họ
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                placeholder="Nhập họ của bạn"
                                className="input-base w-full"
                            />
                        </div>

                        <div>
                            <label className="label flex items-center gap-2">
                                <User className="w-4 h-4 text-muted" />
                                Tên
                            </label>
                            <input
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Nhập tên của bạn"
                                className="input-base w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted" />
                            Địa chỉ Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="email@example.com"
                            className="input-base w-full"
                        />
                        <p className="helper-text">Email này sẽ được dùng để nhận thông báo về đơn hàng</p>
                    </div>

                    <div>
                        <label className="label flex items-center gap-2">
                            <IdCard className="w-4 h-4 text-muted" />
                            Mã sinh viên
                        </label>
                        <input
                            type="text"
                            value={formData.studentId}
                            disabled
                            className="input-base w-full bg-gray-100 dark:bg-gray-900 text-muted cursor-not-allowed"
                        />
                        <p className="helper-text">Mã sinh viên không thể thay đổi</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-6 border-t">
                        <button
                            onClick={handleSave}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Lưu thay đổi
                        </button>
                        <button
                            onClick={handleCancel}
                            className="btn-secondary flex-1 flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" /> Hủy
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Info cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-default">
                            <label className="label flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-muted" />
                                Họ
                            </label>
                            <p className="text-title font-medium text-lg">{userData.firstName}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-default">
                            <label className="label flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-muted" />
                                Tên
                            </label>
                            <p className="text-title font-medium text-lg">{userData.lastName}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-default">
                        <label className="label flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4 text-muted" />
                            Địa chỉ Email
                        </label>
                        <p className="text-title font-medium text-lg">{userData.email}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-default">
                        <label className="label flex items-center gap-2 mb-2">
                            <IdCard className="w-4 h-4 text-muted" />
                            Mã sinh viên
                        </label>
                        <p className="text-title font-medium text-lg">{userData.studentId}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
