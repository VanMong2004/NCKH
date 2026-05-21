export function mapAddress(item = {}) {
    return {
        id: item.id,

        fullName: item.full_name || item.receiver_name || item.name || '',
        phone: item.phone || '',
        email: item.email || '',

        province: item.province || '',
        district: item.district || '',
        ward: item.ward || '',
        addressLine: item.address_line || item.address || '',
        postalCode: item.postal_code || '',

        isDefault: Boolean(item.is_default),

        fullAddress: buildFullAddress(item),

        raw: item,
    };
}

export function mapAddressListResponse(response = {}) {
    const raw = response.data || response.addresses || [];

    return Array.isArray(raw) ? raw.map(mapAddress) : [];
}

export function mapAddressPayload(form = {}) {
    return {
        full_name: form.name || form.fullName || '',
        phone: form.phone || '',
        email: form.email || '',
        province: form.province || 'Cần Thơ',
        district: form.district || 'Ninh Kiều',
        ward: form.ward || 'An Hòa',
        address_line: form.address || form.addressLine || '',
        postal_code: form.postalCode || '900000',
        is_default: Boolean(form.isDefault || false),
    };
}

function buildFullAddress(item = {}) {
    return [item.address_line || item.address, item.ward, item.district, item.province].filter(Boolean).join(', ');
}
