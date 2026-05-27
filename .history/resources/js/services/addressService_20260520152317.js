import api from './api';
import { mapAddressListResponse, mapAddressPayload } from './mappers/addressMapper';

const addressService = {
    async getAddresses() {
        const res = await api.get('/addresses');
        return mapAddressListResponse(res.data);
    },

    async createAddress(payload) {
        const res = await api.post('/addresses', mapAddressPayload(payload));
        return res.data?.data || res.data;
    },
};

export default addressService;
