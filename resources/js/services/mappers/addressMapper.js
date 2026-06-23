export function mapAddress(item = {}) {
    return {
        id: item.id,

        fullName: item.full_name || '',
        phone: item.phone || '',

        province: item.province || '',
        district: item.district || '',
        ward: item.ward || '',
        addressLine: item.address_line || '',

        postalCode: item.postal_code || '',
        isDefault: Boolean(item.is_default),

        createdAt: item.created_at || '',

        fullAddress: buildFullAddress(item),

        raw: item,
    };
}

export function mapAddressListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map(mapAddress);
}

export function mapAddressResponse(response = {}) {
    return mapAddress(response.data || {});
}

export function mapAddressActionResponse(response = {}) {
    return {
        success: Boolean(response.success),
        message: response.message || '',
        data: response.data || null,
        raw: response,
    };
}

export function mapAddressPayload(form = {}) {
    return {
        full_name: form.fullName || '',
        phone: form.phone || '',
        province: form.province || '',
        district: form.district || '',
        ward: form.ward || '',
        address_line: form.addressLine || '',
        postal_code: form.postalCode || '',
        is_default: Boolean(form.isDefault),
    };
}

function buildFullAddress(item = {}) {
    return [item.address_line, item.ward, item.district, item.province].filter(Boolean).join(', ');
}
