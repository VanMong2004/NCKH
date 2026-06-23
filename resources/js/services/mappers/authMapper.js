export function mapUser(item = {}) {
    return {
        id: item.id,
        name: item.name || '',
        email: item.email || '',
        phone: item.phone || '',
        mssv: item.mssv || '',
        role: item.role || '',
        avatar: item.avatar || item.avatar_url || '',
        raw: item,
    };
}

export function mapMeResponse(response = {}) {
    return {
        success: Boolean(response.success),
        message: response.message || '',
        data: mapUser(response.data || {}),
        raw: response,
    };
}

export function mapAuthResponse(response = {}) {
    const data = response.data || {};

    return {
        success: Boolean(response.success),
        message: response.message || '',
        data: {
            token: data.token || '',
            user: mapUser(data.user || {}),
        },
        raw: response,
    };
}

export function mapAuthActionResponse(response = {}) {
    return {
        success: Boolean(response.success),
        message: response.message || '',
        data: response.data || null,
        raw: response,
    };
}
