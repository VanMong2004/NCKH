export function mapContactInfo(data = {}) {
    return {
        schoolName: data.school_name || '',
        address: data.address || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        mapUrl: data.map_url || '',
        raw: data,
    };
}

export function mapContactInfoResponse(response = {}) {
    return mapContactInfo(response.data || {});
}

export function mapContactSubmitResponse(response = {}) {
    const data = response.data || {};

    return {
        id: data.id,
        fullName: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        subject: data.subject || '',
        message: data.message || '',
        status: data.status || '',
        createdAt: data.created_at || '',
        success: Boolean(response.success),
        responseMessage: response.message || '',
        raw: data,
    };
}
