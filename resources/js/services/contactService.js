import api from './api';

import { mapContactInfoResponse, mapContactSubmitResponse } from './mappers/contactMapper';

const contactService = {
    async getInfo() {
        const res = await api.get('/contact-info');
        return mapContactInfoResponse(res.data);
    },

    async submit(payload) {
        const res = await api.post('/contact', payload);
        return mapContactSubmitResponse(res.data);
    },
};

export default contactService;
