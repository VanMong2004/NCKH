import api from './api';

import { mapAboutResponse } from './mappers/aboutMapper';

const aboutService = {
    async getAbout() {
        const res = await api.get('/about');
        return mapAboutResponse(res.data);
    },
};

export default aboutService;
