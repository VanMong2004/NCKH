import api from './api';

import {
    mapAddressActionResponse,
    mapAddressListResponse,
    mapAddressPayload,
    mapAddressResponse,
} from './mappers/addressMapper';

const addressService = {
    async getAddresses() {
        const res = await api.get('/addresses');
        return mapAddressListResponse(res.data);
    },

    async createAddress(payload) {
        const res = await api.post('/addresses', mapAddressPayload(payload));
        return mapAddressResponse(res.data);
    },

    async updateAddress(id, payload) {
        const res = await api.put(`/addresses/${id}`, mapAddressPayload(payload));
        return mapAddressResponse(res.data);
    },

    async deleteAddress(id) {
        const res = await api.delete(`/addresses/${id}`);
        return mapAddressActionResponse(res.data);
    },

    async setDefault(id) {
        const res = await api.post(`/addresses/${id}/default`);
        return mapAddressResponse(res.data);
    },
};

export default addressService;
