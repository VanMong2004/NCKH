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
        full_name: form.fullName || form.name || '',
        phone: form.phone || '',
        province: form.province || '',
        district: form.district || '',
        ward: form.ward || '',
        address_line: form.addressLine || form.address || '',
        postal_code: form.postalCode || '',
        is_default: Boolean(form.isDefault),
    };
}

function buildFullAddress(item = {}) {
    return [item.address_line, item.ward, item.district, item.province].filter(Boolean).join(', ');
}
