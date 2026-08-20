function toNumber(value) {
    return Number(value || 0);
}

function toBoolean(value) {
    return value === true || value === 1 || value === '1';
}

export function getApprovedAnswerStatusText(status) {
    const map = {
        draft: 'Bản nháp',
        approved: 'Đã duyệt',
    };

    return map[status] || 'Không rõ';
}

export function getApprovedAnswerStatusClass(status) {
    const map = {
        draft: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    };

    return map[status] || map.draft;
}

export function mapAdminChatApprovedAnswer(item = {}) {
    return {
        id: item.id,
        question: item.question || '',
        normalizedQuestion: item.normalized_question || '',
        answer: item.answer || '',
        intent: item.intent || 'static_knowledge',
        intentSignature: item.intent_signature || '',
        entitiesJson: item.entities_json && typeof item.entities_json === 'object' ? item.entities_json : null,
        status: item.status || 'draft',
        statusText: getApprovedAnswerStatusText(item.status || 'draft'),
        statusClass: getApprovedAnswerStatusClass(item.status || 'draft'),
        isActive: toBoolean(item.is_active),
        useCount: toNumber(item.use_count),
        lastUsedAt: item.last_used_at || '',
        approvedBy: item.approved_by || null,
        approvedAt: item.approved_at || '',
        effectiveFrom: item.effective_from || '',
        effectiveTo: item.effective_to || '',
        sourceType: item.source_type || '',
        sourceReference: item.source_reference || '',
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        raw: item,
    };
}

export function mapAdminChatApprovedAnswerListResponse(response = {}) {
    const paginator = response.data || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        answers: raw.map(mapAdminChatApprovedAnswer),
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 15),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminChatApprovedAnswerDetailResponse(response = {}) {
    return mapAdminChatApprovedAnswer(response.data || {});
}
