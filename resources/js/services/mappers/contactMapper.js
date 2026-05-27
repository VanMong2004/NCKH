const DEFAULT_CONTACT_INFO = {
    schoolName: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
    address: '256 Nguyễn Văn Cừ, Quận Ninh Kiều, TP. Cần Thơ',
    email: 'contact@ctuet.edu.vn',
    phone: '0292 3891 698',
    website: 'https://ctuet.edu.vn/',
    mapUrl: 'https://maps.app.goo.gl/uArkPsittm4Eu4NS6',
};

export function mapContactInfo(data = {}) {
    return {
        schoolName: data.school_name || data.schoolName || DEFAULT_CONTACT_INFO.schoolName,
        address: data.address || DEFAULT_CONTACT_INFO.address,
        email: data.email || DEFAULT_CONTACT_INFO.email,
        phone: data.phone || DEFAULT_CONTACT_INFO.phone,
        website: data.website || DEFAULT_CONTACT_INFO.website,
        mapUrl: data.map_url || data.mapUrl || DEFAULT_CONTACT_INFO.mapUrl,
        raw: data,
    };
}

export function mapContactInfoResponse(response = {}) {
    return mapContactInfo(response.data || response.contact || response);
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
        status: data.status || 'pending',
        createdAt: data.created_at || '',
        success: Boolean(response.success ?? true),
        responseMessage: response.message || 'Gửi liên hệ thành công',
        raw: data,
    };
}
