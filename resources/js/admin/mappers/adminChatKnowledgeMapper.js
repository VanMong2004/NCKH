function toNumber(value) {
    return Number(value || 0);
}

function toBoolean(value) {
    return value === true || value === 1 || value === '1';
}

export function formatFileSize(size) {
    const bytes = toNumber(size);

    if (!bytes) return '0 KB';

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getKnowledgeStatusText(status) {
    const map = {
        pending: 'Đang chờ',
        processing: 'Đang xử lý',
        completed: 'Hoàn tất',
        failed: 'Thất bại',
        cancelled: 'Đã hủy',
    };

    return map[status] || 'Không rõ';
}

export function getKnowledgeStatusClass(status) {
    const map = {
        pending:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        processing:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
        completed:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
        failed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
        cancelled:
            'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };

    return map[status] || map.cancelled;
}

export function mapAdminChatKnowledgeFile(item = {}) {
    const originalName = item.original_name || '';
    const title = item.title || originalName || 'Tài liệu AI';

    return {
        id: item.id,
        title,
        description: item.description || '',
        originalName,
        mimeType: item.mime_type || '',
        size: toNumber(item.size),
        sizeText: formatFileSize(item.size),

        openaiFileId: item.openai_file_id || '',
        vectorStoreId: item.vector_store_id || '',
        vectorStoreFileId: item.vector_store_file_id || '',

        status: item.status || 'pending',
        statusText: getKnowledgeStatusText(item.status || 'pending'),
        statusClass: getKnowledgeStatusClass(item.status || 'pending'),

        errorMessage: item.error_message || '',
        isActive: toBoolean(item.is_active),
        uploadedBy: item.uploaded_by || null,

        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',

        raw: item,
    };
}

export function mapAdminChatKnowledgeListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    const files = raw.map(mapAdminChatKnowledgeFile);

    return {
        success: Boolean(response.success),
        message: response.message || '',
        files,
        summary: {
            total: files.length,
            active: files.filter((item) => item.isActive).length,
            completed: files.filter((item) => item.status === 'completed').length,
            processing: files.filter((item) => ['pending', 'processing'].includes(item.status)).length,
            failed: files.filter((item) => item.status === 'failed').length,
            cancelled: files.filter((item) => item.status === 'cancelled').length,
        },
        raw: response,
    };
}

export function mapAdminChatKnowledgeDetailResponse(response = {}) {
    return mapAdminChatKnowledgeFile(response.data || {});
}
