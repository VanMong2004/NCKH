import api from './api';
import { mapAddress, mapAddressListResponse, mapAddressPayload } from './mappers/addressMapper';

const addressService = {
    async getAddresses() {
        const res = await api.get('/addresses');
        return mapAddressListResponse(res.data);
    },

    async createAddress(payload) {
        const res = await api.post('/addresses', mapAddressPayload(payload));
        return mapAddress(res.data?.data || res.data);
    },

    async updateAddress(id, payload) {
        const res = await api.put(`/addresses/${id}`, mapAddressPayload(payload));
        return mapAddress(res.data?.data || res.data);
    },

    async deleteAddress(id) {
        const res = await api.delete(`/addresses/${id}`);
        return res.data;
    },

    async setDefault(id) {
        const res = await api.post(`/addresses/${id}/default`);
        return mapAddress(res.data?.data || res.data);
    },
};

export default addressService;
