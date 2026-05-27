import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import notificationService from '../../services/notificationService';

export default function AccountNotifications() {
    const [notifications, setNotifications] = useState([]);

    const [selected, setSelected] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const result = await notificationService.getNotifications();

            setNotifications(result.notifications);

            if (result.notifications.length) {
                setSelected(result.notifications[0]);
            }
        } catch {
            toast.error('Không thể tải thông báo');
        }
    }

    async function handleRead(id) {
        await notificationService.markRead(id);

        loadData();
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="rounded-2xl border bg-white dark:bg-slate-900">
                <div className="flex justify-between p-4">
                    <h2 className="font-bold text-blue-950 dark:text-white">Thông báo</h2>

                    <button
                        onClick={async () => {
                            await notificationService.markAllRead();

                            loadData();
                        }}
                    >
                        Đánh dấu tất cả
                    </button>
                </div>

                <div>
                    {notifications.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => {
                                setSelected(item);

                                handleRead(item.id);
                            }}
                            className={`
                            cursor-pointer
                            border-b
                            p-4
                            ${!item.isRead && 'bg-blue-50 dark:bg-slate-800'}
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">{item.icon}</div>

                                <div>
                                    <p className="font-bold dark:text-white">{item.title}</p>

                                    <p className="text-sm text-slate-500">{item.message}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 dark:bg-slate-900">
                {selected ? (
                    <>
                        <div className="mb-5 text-5xl">{selected.icon}</div>

                        <h2 className="text-xl font-bold dark:text-white">{selected.title}</h2>

                        <p className="mt-4 text-slate-500">{selected.message}</p>

                        <p className="mt-5 text-xs text-slate-400">{selected.createdAt}</p>
                    </>
                ) : (
                    <p>Chọn thông báo</p>
                )}
            </div>
        </div>
    );
}
